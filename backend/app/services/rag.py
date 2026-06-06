import os
import logging
from .watsonx import WatsonxService

logger = logging.getLogger(__name__)

# Try importing chromadb, fall back to in-memory store if it fails
try:
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("chromadb package not found. Using high-fidelity in-memory vector store fallback.")

class WatsonxEmbeddingFunction:
    def __init__(self, watsonx_service: WatsonxService):
        self.watsonx_service = watsonx_service

    def __call__(self, input):
        embeddings = []
        for text in input:
            embeddings.append(self.watsonx_service.get_embedding(text))
        return embeddings

# ----------------- In-Memory Vector Store Fallback -----------------
class InMemoryCollection:
    def __init__(self, name: str, embedding_fn):
        self.name = name
        self.embedding_fn = embedding_fn
        self.documents = []  # list of dicts: {"id": str, "content": str, "metadata": dict, "vector": list}

    def count(self) -> int:
        return len(self.documents)

    def add(self, documents: list, metadatas: list, ids: list):
        # Calculate vectors for all documents
        vectors = self.embedding_fn(documents)
        for doc_id, doc_text, meta, vec in zip(ids, documents, metadatas, vectors):
            # Avoid duplicate IDs
            self.documents = [d for d in self.documents if d["id"] != doc_id]
            self.documents.append({
                "id": doc_id,
                "content": doc_text,
                "metadata": meta,
                "vector": vec
            })

    def query(self, query_texts: list, n_results: int = 3) -> dict:
        if not query_texts:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
            
        # Get query vector
        query_vec = self.embedding_fn([query_texts[0]])[0]
        
        # Calculate similarities (dot product)
        scored_docs = []
        for doc in self.documents:
            doc_vec = doc["vector"]
            # Dot product
            dot_prod = sum(q * d for q, d in zip(query_vec, doc_vec))
            
            # Cosine distance is typically 1 - similarity.
            # We want similar items (higher dot product) to have smaller distances.
            distance = 1.0 - dot_prod
            scored_docs.append((distance, doc))
            
        # Sort by distance (smaller distance = more similar)
        scored_docs.sort(key=lambda x: x[0])
        results = scored_docs[:n_results]
        
        documents_list = [r[1]["content"] for r in results]
        metadatas_list = [r[1]["metadata"] for r in results]
        distances_list = [r[0] for r in results]
        ids_list = [r[1]["id"] for r in results]
        
        return {
            "documents": [documents_list],
            "metadatas": [metadatas_list],
            "distances": [distances_list],
            "ids": [ids_list]
        }

    def get(self) -> dict:
        return {
            "ids": [d["id"] for d in self.documents],
            "documents": [d["content"] for d in self.documents],
            "metadatas": [d["metadata"] for d in self.documents]
        }

class InMemoryChromaClient:
    def __init__(self):
        self.collections = {}

    def get_or_create_collection(self, name: str, embedding_function):
        if name not in self.collections:
            self.collections[name] = InMemoryCollection(name, embedding_function)
        return self.collections[name]

# ----------------- RAG Service Implementation -----------------
class RAGService:
    def __init__(self, watsonx_service: WatsonxService):
        self.watsonx_service = watsonx_service
        self.embedding_fn = WatsonxEmbeddingFunction(self.watsonx_service)
        self.collection_name = "career_knowledge"
        
        if CHROMADB_AVAILABLE:
            try:
                self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chroma")
                os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
                self.client = chromadb.PersistentClient(path=self.db_path)
                self.collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    embedding_function=self.embedding_fn
                )
            except Exception as e:
                logger.error(f"Failed to initialize persistent ChromaDB: {e}. Falling back to in-memory.")
                self.client = InMemoryChromaClient()
                self.collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    embedding_function=self.embedding_fn
                )
        else:
            self.client = InMemoryChromaClient()
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                embedding_function=self.embedding_fn
            )
            
        # Seed database if it is empty
        if self.collection.count() == 0:
            self.seed_database()

    def add_document(self, doc_id: str, text: str, metadata: dict):
        """Add a single document to the collection."""
        self.collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[doc_id]
        )

    def search(self, query: str, n_results: int = 3) -> list:
        """Search the knowledge base for relevant documents."""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            # Compile outputs into a list of dicts
            documents = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0] if "distances" in results else [0]*len(documents)
            
            output = []
            for doc, meta, dist in zip(documents, metadatas, distances):
                output.append({
                    "content": doc,
                    "metadata": meta,
                    "score": float(1.0 - dist) if dist is not None else 0.0
                })
            return output
        except Exception as e:
            logger.error(f"Error querying RAG knowledge base: {str(e)}")
            return []

    def get_all_documents(self):
        """Retrieve all documents in the collection (useful for Admin view)."""
        try:
            results = self.collection.get()
            output = []
            ids = results.get("ids", [])
            # Support list-of-lists vs flat list representation differences in Chroma get()
            docs = results.get("documents", [])
            metas = results.get("metadatas", [])
            
            if docs and isinstance(docs[0], list):
                # Flattens if collection return is nested (in-memory mock mimics this structure)
                ids = ids[0] if ids else []
                docs = docs[0] if docs else []
                metas = metas[0] if metas else []

            for i, d, m in zip(ids, docs, metas):
                output.append({
                    "id": i,
                    "content": d,
                    "metadata": m
                })
            return output
        except Exception as e:
            logger.error(f"Error getting all documents: {str(e)}")
            return []

    def seed_database(self):
        """Populate ChromaDB with initial career guides and technology frameworks."""
        logger.info("RAGService: Seeding career knowledge base...")
        
        seed_data = [
            # 1. AI/ML Engineer
            {
                "id": "career_ai_ml_engineer",
                "content": (
                    "Career Guide: AI/ML Engineer. Artificial Intelligence and Machine Learning Engineers design and build AI models "
                    "such as neural networks, LLMs, and regression models. Key skills include Python, PyTorch, TensorFlow, Scikit-learn, "
                    "pandas, NumPy, SQL, Git, and Docker. Trending certifications: AWS Certified Machine Learning - Specialty, "
                    "Google Professional Machine Learning Engineer, and Nvidia Deep Learning Institute certifications. "
                    "Industry trends indicate heavy growth in Generative AI, LLM Fine-Tuning, Retrieval-Augmented Generation (RAG), "
                    "and LLMOps. Entry salary ranges from $95,000 to $120,000. Demand level is Critical."
                ),
                "metadata": {"career": "AI/ML Engineer", "category": "Guide", "demand": "Critical"}
            },
            # 2. Data Scientist
            {
                "id": "career_data_scientist",
                "content": (
                    "Career Guide: Data Scientist. Data Scientists analyze and interpret complex data to help companies make decisions. "
                    "Key skills include Python, R, SQL, Pandas, Tableau, PowerBI, statistical modeling, machine learning, A/B testing, "
                    "and communication. Trending certifications: IBM Data Science Professional Certificate, Google Advanced Data Analytics Professional, "
                    "and SAS Certified Advanced Analytics Professional. Industry trends show growth in automated machine learning (AutoML), "
                    "real-time streaming analytics, and ethical AI. Entry salary ranges from $85,000 to $110,000. Demand level is High."
                ),
                "metadata": {"career": "Data Scientist", "category": "Guide", "demand": "High"}
            },
            # 3. Full-Stack Software Engineer
            {
                "id": "career_software_engineer",
                "content": (
                    "Career Guide: Full-Stack Software Engineer. Software Engineers design, write, test, and deploy applications. "
                    "Key skills include JavaScript/TypeScript, React.js, Next.js, Node.js, Python, FastAPI, Java, Spring Boot, SQL, PostgreSQL, "
                    "NoSQL, Git, Docker, and CI/CD pipelines. Trending certifications: AWS Certified Developer - Associate, "
                    "Microsoft Certified: Azure Developer Associate. Industry trends emphasize serverless architectures, micro-frontends, "
                    "and API-first development. Entry salary ranges from $80,000 to $115,000. Demand level is High."
                ),
                "metadata": {"career": "Full-Stack Software Engineer", "category": "Guide", "demand": "High"}
            },
            # 4. Product Manager
            {
                "id": "career_product_manager",
                "content": (
                    "Career Guide: Product Manager (Tech). Product Managers define the product vision, roadmap, and features. "
                    "Key skills include product strategy, Agile/Scrum, wireframing, SQL, user research, data analysis, and cross-functional leadership. "
                    "Trending certifications: Certified Scrum Product Owner (CSPO), Pragmatic Institute Product Management, and Agile Alliance certifications. "
                    "Industry trends highlight growth in product-led growth (PLG) strategies and AI product management. "
                    "Entry salary ranges from $90,000 to $125,000. Demand level is Medium-High."
                ),
                "metadata": {"career": "Product Manager", "category": "Guide", "demand": "Medium-High"}
            },
            # 5. Cloud Architect / Engineer
            {
                "id": "career_cloud_architect",
                "content": (
                    "Career Guide: Cloud Solutions Architect. Cloud Engineers build, maintain, and secure cloud infrastructure. "
                    "Key skills include AWS, Azure, Google Cloud (GCP), Terraform (Infrastructure as Code), Docker, Kubernetes, CI/CD (GitHub Actions, Jenkins), "
                    "networking, and bash scripting. Trending certifications: AWS Certified Solutions Architect - Associate/Professional, "
                    "HashiCorp Certified Terraform Associate, and Certified Kubernetes Administrator (CKA). "
                    "Industry trends show massive transition to multi-cloud setups and GitOps. Entry salary ranges from $90,000 to $130,000. Demand level is High."
                ),
                "metadata": {"career": "Cloud Solutions Architect", "category": "Guide", "demand": "High"}
            },
            # 6. Cybersecurity Analyst
            {
                "id": "career_cybersecurity",
                "content": (
                    "Career Guide: Cybersecurity Analyst. Security Analysts protect organizational assets from digital threats. "
                    "Key skills include networking protocols, penetration testing, vulnerability assessment, SIEM tools, firewall management, and Linux administration. "
                    "Trending certifications: CompTIA Security+, Certified Ethical Hacker (CEH), and CISSP (for advanced positions). "
                    "Industry trends point to Zero Trust Architectures, cloud security posture management, and AI-driven threat detection. "
                    "Entry salary ranges from $85,000 to $115,000. Demand level is Critical."
                ),
                "metadata": {"career": "Cybersecurity Analyst", "category": "Guide", "demand": "Critical"}
            }
        ]
        
        for item in seed_data:
            self.add_document(
                doc_id=item["id"],
                text=item["content"],
                metadata=item["metadata"]
            )
        logger.info(f"RAGService: Seeded {len(seed_data)} default career documents.")
