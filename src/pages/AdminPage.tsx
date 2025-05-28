
import { useState } from 'react';
import { Calendar, Database, Globe, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface CelebrityDeath {
  name: string;
  dateOfDeath: string;
  age?: number;
  causeOfDeath?: string;
  source: 'wikidata' | 'wikipedia' | 'incendar';
  approved: boolean;
  id: string;
}

export default function AdminPage() {
  const [selectedDays, setSelectedDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeaths, setPendingDeaths] = useState<CelebrityDeath[]>([]);
  const [activeTab, setActiveTab] = useState<'query' | 'approve'>('query');

  // WikiData SPARQL Query
  const queryWikiData = async (days: number): Promise<CelebrityDeath[]> => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const sparqlQuery = `
      SELECT DISTINCT ?person ?personLabel ?deathDate ?birthDate ?causeLabel WHERE {
        ?person wdt:P31 wd:Q5 .
        ?person wdt:P570 ?deathDate .
        OPTIONAL { ?person wdt:P569 ?birthDate }
        OPTIONAL { ?person wdt:P509 ?cause . ?cause rdfs:label ?causeLabel . FILTER(LANG(?causeLabel) = "en") }
        FILTER(?deathDate >= "${startDate.toISOString().split('T')[0]}"^^xsd:dateTime)
        FILTER(?deathDate <= "${endDate.toISOString().split('T')[0]}"^^xsd:dateTime)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
      }
      ORDER BY DESC(?deathDate)
      LIMIT 50
    `;

    try {
      const response = await fetch('https://query.wikidata.org/sparql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: `query=${encodeURIComponent(sparqlQuery)}`,
      });

      if (!response.ok) throw new Error('WikiData query failed');

      const data = await response.json();
      
      return data.results.bindings.map((item: any, index: number) => {
        const birthDate = item.birthDate?.value ? new Date(item.birthDate.value) : null;
        const deathDate = new Date(item.deathDate.value);
        const age = birthDate ? Math.floor((deathDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined;

        return {
          id: `wd_${index}_${Date.now()}`,
          name: item.personLabel.value,
          dateOfDeath: item.deathDate.value.split('T')[0],
          age,
          causeOfDeath: item.causeLabel?.value || 'Unknown',
          source: 'wikidata' as const,
          approved: false,
        };
      });
    } catch (error) {
      console.error('WikiData query error:', error);
      throw error;
    }
  };

  // Wikipedia Scraping (using a proxy service or backend API)
  const scrapeWikipedia = async (days: number): Promise<CelebrityDeath[]> => {
    // Note: This would typically require a backend service to scrape Wikipedia
    // due to CORS restrictions. For demo purposes, returning mock data.
    
    try {
      // In production, you'd call your backend API:
      // const response = await fetch('/api/scrape-wikipedia', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ days })
      // });
      
      // Mock implementation for demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This would be actual scraped data from Wikipedia's "Deaths in 2025" pages
      return [
        {
          id: `wp_${Date.now()}`,
          name: 'Wikipedia Example Celebrity',
          dateOfDeath: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          age: Math.floor(Math.random() * 40) + 50,
          causeOfDeath: 'Natural causes',
          source: 'wikipedia' as const,
          approved: false,
        }
      ];
    } catch (error) {
      console.error('Wikipedia scraping error:', error);
      throw error;
    }
  };

  // Incendar Scraping
  const scrapeIncendar = async (): Promise<CelebrityDeath[]> => {
    try {
      // This would require a backend service to scrape the Incendar page
      // const response = await fetch('/api/scrape-incendar');
      
      // Mock implementation for demo
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      return [
        {
          id: `inc_${Date.now()}`,
          name: 'Incendar Example Celebrity',
          dateOfDeath: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          age: Math.floor(Math.random() * 40) + 40,
          causeOfDeath: 'Heart failure',
          source: 'incendar' as const,
          approved: false,
        }
      ];
    } catch (error) {
      console.error('Incendar scraping error:', error);
      throw error;
    }
  };

  const handleQuery = async (source: 'wikidata' | 'wikipedia' | 'incendar') => {
    setIsLoading(true);
    try {
      let newDeaths: CelebrityDeath[] = [];
      
      switch (source) {
        case 'wikidata':
          newDeaths = await queryWikiData(selectedDays);
          break;
        case 'wikipedia':
          newDeaths = await scrapeWikipedia(selectedDays);
          break;
        case 'incendar':
          newDeaths = await scrapeIncendar();
          break;
      }
      
      // Remove duplicates
      const existingNames = new Set(pendingDeaths.map(d => d.name.toLowerCase()));
      const uniqueNewDeaths = newDeaths.filter(d => !existingNames.has(d.name.toLowerCase()));
      
      setPendingDeaths(prev => [...prev, ...uniqueNewDeaths]);
      setActiveTab('approve');
      
      toast.success(`Found ${uniqueNewDeaths.length} new deaths from ${source}`);
    } catch (error) {
      toast.error(`Failed to query ${source}. Please try again.`);
      console.error('Error querying data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = (id: string, approved: boolean) => {
    setPendingDeaths(prev => 
      prev.map(death => 
        death.id === id ? { ...death, approved } : death
      )
    );
  };

  const handleBulkApproval = (approve: boolean) => {
    setPendingDeaths(prev => 
      prev.map(death => ({ ...death, approved: approve }))
    );
  };

  const submitApprovedDeaths = async () => {
    const approvedDeaths = pendingDeaths.filter(d => d.approved);
    
    if (approvedDeaths.length === 0) {
      toast.error('No deaths approved for submission');
      return;
    }

    try {
      // Insert approved deaths into Supabase
      const { error } = await supabase
        .from('celebrity_deaths')
        .insert(
          approvedDeaths.map(death => ({
            celebrity_name: death.name,
            date_of_death: new Date(death.dateOfDeath).toISOString(),
            cause_of_death: death.causeOfDeath || 'Unknown',
          }))
        );

      if (error) throw error;

      // Remove approved deaths from pending list
      setPendingDeaths(prev => prev.filter(d => !d.approved));
      
      toast.success(`Successfully added ${approvedDeaths.length} celebrity deaths`);
    } catch (error) {
      toast.error('Failed to submit approved deaths');
      console.error('Error submitting deaths:', error);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'wikidata': return <Database className="w-4 h-4" />;
      case 'wikipedia': return <Globe className="w-4 h-4" />;
      case 'incendar': return <Calendar className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'wikidata': return 'bg-blue-100 text-blue-800';
      case 'wikipedia': return 'bg-green-100 text-green-800';
      case 'incendar': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Query and approve celebrity death records</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab('query')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'query' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Query Data Sources
        </button>
        <button
          onClick={() => setActiveTab('approve')}
          className={`px-4 py-2 rounded-lg font-medium relative ${
            activeTab === 'approve' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Approve Deaths
          {pendingDeaths.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {pendingDeaths.length}
            </span>
          )}
        </button>
      </div>

      {/* Query Tab */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          {/* Day Selection */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Time Range Selection</h2>
            <div className="flex items-center space-x-4">
              <label className="text-gray-300">Query deaths from the last:</label>
              <select
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
                className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-red-500 focus:outline-none"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>

          {/* Data Source Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WikiData */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Database className="w-6 h-6 text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">WikiData Query</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Query structured data from Wikidata using SPARQL. Most comprehensive and accurate data.
              </p>
              <button
                onClick={() => handleQuery('wikidata')}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-medium flex items-center justify-center"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                Query WikiData
              </button>
            </div>

            {/* Wikipedia */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Globe className="w-6 h-6 text-green-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Wikipedia Scraper</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Scrape Wikipedia's "Deaths in [Year]" pages for recent celebrity deaths.
              </p>
              <button
                onClick={() => handleQuery('wikipedia')}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-medium flex items-center justify-center"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                Scrape Wikipedia
              </button>
            </div>

            {/* Incendar */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Calendar className="w-6 h-6 text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Incendar Deaths</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Scrape recent high-profile deaths from Incendar's death clock page.
              </p>
              <button
                onClick={() => handleQuery('incendar')}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-medium flex items-center justify-center"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                Scrape Incendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Tab */}
      {activeTab === 'approve' && (
        <div className="space-y-6">
          {pendingDeaths.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">No pending deaths to approve. Query some data sources first.</p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Pending Deaths ({pendingDeaths.length})</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkApproval(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve All
                    </button>
                    <button
                      onClick={() => handleBulkApproval(false)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject All
                    </button>
                    <button
                      onClick={submitApprovedDeaths}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium flex items-center disabled:bg-gray-600"
                      disabled={!pendingDeaths.some(d => d.approved)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Submit Approved
                    </button>
                  </div>
                </div>
              </div>

              {/* Deaths List */}
              <div className="space-y-3">
                {pendingDeaths.map((death) => (
                  <div
                    key={death.id}
                    className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                      death.approved 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{death.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getSourceColor(death.source)}`}>
                            {getSourceIcon(death.source)}
                            <span className="capitalize">{death.source}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                          <div>
                            <span className="font-medium">Date of Death:</span> {death.dateOfDeath}
                          </div>
                          {death.age && (
                            <div>
                              <span className="font-medium">Age:</span> {death.age}
                            </div>
                          )}
                          {death.causeOfDeath && (
                            <div>
                              <span className="font-medium">Cause:</span> {death.causeOfDeath}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApproval(death.id, true)}
                          className={`p-2 rounded ${
                            death.approved 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleApproval(death.id, false)}
                          className={`p-2 rounded ${
                            !death.approved 
                              ? 'bg-red-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white'
                          }`}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
