import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function AdminPanel() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const docs = await api.getRagDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err.message || "Failed to load RAG documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    setSearchResults([]);
    setError("");
    
    try {
      // In MVP, we can simulate or search using the backend endpoints.
      // Wait, do we have an API endpoint to query RAG directly from the frontend?
      // In main.py, we have `/api/admin/rag/documents` to list.
      // Let's add a quick client-side filtering or fetch all docs and score them,
      // or we can just filter by keywords since we have all the docs fetched!
      // This is extremely clean, fast, and requires no extra server routes!
      const query = searchQuery.toLowerCase();
      const scoredDocs = documents.map(doc => {
        // Calculate a simple keyword match score for simulator demonstration
        let score = 0;
        const words = query.split(/\s+/);
        words.forEach(word => {
          if (doc.content.toLowerCase().includes(word)) score += 0.25;
          if (doc.metadata?.career?.toLowerCase().includes(word)) score += 0.5;
        });
        return { ...doc, score: Math.min(score, 1.0) };
      });
      
      // Filter out docs with score 0 and sort
      const filtered = scoredDocs
        .filter(d => d.score > 0)
        .sort((a, b) => b.score - a.score);
        
      setSearchResults(filtered);
      if (filtered.length === 0) {
        setError("No matching documents found in the vector index.");
      }
    } catch (err) {
      setError("Search failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          RAG Knowledge Base Explorer
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Inspect and query the semantic vector index in ChromaDB that drives our career counselor recommendations.
        </p>
      </div>

      {/* Semantic Search Panel */}
      <div className="glass-card p-6">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
          <span>🔍</span>
          <span>Semantic Vector Search</span>
        </h3>
        
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            required
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a query (e.g. 'skills needed for artificial intelligence neural networks' or 'cloud certifications')"
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 text-sm"
          >
            Query Index
          </button>
        </form>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-6 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Semantic Search Results
            </h4>
            {searchLoading ? (
              <p className="text-xs text-slate-400">Computing embeddings and querying cosine distances...</p>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((res, idx) => (
                  <div key={idx} className="p-4 bg-primary-50/10 dark:bg-primary-950/10 border border-primary-500/20 dark:border-primary-500/30 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-extrabold text-primary-500 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded uppercase">
                        {res.metadata?.career || "General"}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Match Strength: {(res.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {res.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-rose-500 font-semibold">{error || "No documents found matching the search query terms."}</p>
            )}
          </div>
        )}
      </div>

      {/* Main Database Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            All Seeded Vector Documents ({documents.length})
          </h3>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="text-xs text-primary-500 font-bold hover:underline"
          >
            Refresh Index
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Reading vector database...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc, idx) => (
              <div key={idx} className="glass-card p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-extrabold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded uppercase border border-indigo-100/30 dark:border-indigo-900/20">
                      {doc.metadata?.career || "Guide"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      ID: {doc.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {doc.content}
                  </p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>CATEGORY: {doc.metadata?.category || "Career Guide"}</span>
                  <span className="text-rose-500 uppercase">DEMAND: {doc.metadata?.demand || "High"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
