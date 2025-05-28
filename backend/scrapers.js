// backend/scrapers.js
// You'll need to install: npm install express cors cheerio axios date-fns

const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const axios = require('axios');
const { subDays, format } = require('date-fns');

const app = express();
app.use(cors());
app.use(express.json());

// Wikipedia Scraper
app.post('/api/scrape-wikipedia', async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const deaths = [];
    const currentYear = new Date().getFullYear();
    
    // Wikipedia's "Deaths in [Year]" page URL
    const wikiUrl = `https://en.wikipedia.org/wiki/Deaths_in_${currentYear}`;
    
    const response = await axios.get(wikiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const cutoffDate = subDays(new Date(), days);
    
    // Wikipedia structures deaths by month, then by day
    $('.mw-headline').each((i, monthElement) => {
      const monthText = $(monthElement).text();
      const monthMatch = monthText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/);
      
      if (monthMatch) {
        const month = monthMatch[1];
        const monthSection = $(monthElement).parent().next('div');
        
        // Find all daily sections within this month
        monthSection.find('h4').each((j, dayElement) => {
          const dayText = $(dayElement).text();
          const dayMatch = dayText.match(/(\d{1,2})/);
          
          if (dayMatch) {
            const day = parseInt(dayMatch[1]);
            const deathDate = new Date(currentYear, getMonthNumber(month), day);
            
            // Only include deaths within our date range
            if (deathDate >= cutoffDate) {
              const daySection = $(dayElement).next('ul');
              
              daySection.find('li').each((k, personElement) => {
                const personText = $(personElement).text();
                const personLink = $(personElement).find('a').first();
                const personName = personLink.text() || extractNameFromText(personText);
                
                if (personName && personName.length > 2) {
                  const ageMatch = personText.match(/(\d{2,3})/);
                  const age = ageMatch ? parseInt(ageMatch[1]) : null;
                  
                  // Extract cause of death (often in parentheses or after specific keywords)
                  const causeMatch = personText.match(/(?:died of|from|due to|caused by)\s+([^,.\n]+)/i) ||
                                  personText.match(/\(([^)]+(?:cancer|heart|stroke|accident|suicide)[^)]*)\)/i);
                  const cause = causeMatch ? causeMatch[1].trim() : 'Natural causes';
                  
                  deaths.push({
                    name: personName.trim(),
                    dateOfDeath: format(deathDate, 'yyyy-MM-dd'),
                    age: age,
                    causeOfDeath: cause,
                    source: 'wikipedia'
                  });
                }
              });
            }
          }
        });
      }
    });
    
    res.json({ deaths: deaths.slice(0, 50) }); // Limit to 50 results
    
  } catch (error) {
    console.error('Wikipedia scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape Wikipedia' });
  }
});

// Incendar Scraper
app.post('/api/scrape-incendar', async (req, res) => {
  try {
    const incendarUrl = 'https://incendar.com/deathclock-recent-high-profile-media-famous-deaths-in-us-united-states.php';
    
    const response = await axios.get(incendarUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const deaths = [];
    
    // Incendar typically uses tables or specific div structures for death listings
    // This selector may need adjustment based on their current page structure
    $('.death-entry, .recent-death, table tr').each((i, element) => {
      const text = $(element).text();
      const nameElement = $(element).find('a, .name, strong').first();
      
      if (nameElement.length > 0) {
        const name = nameElement.text().trim();
        
        if (name && name.length > 2) {
          // Extract date (look for various date formats)
          const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i);
          const dateStr = dateMatch ? dateMatch[1] : format(new Date(), 'yyyy-MM-dd');
          
          // Extract age
          const ageMatch = text.match(/age\s+(\d{2,3})|(\d{2,3})\s+years?\s+old/i);
          const age = ageMatch ? parseInt(ageMatch[1] || ageMatch[2]) : null;
          
          // Extract cause of death
          const causeMatch = text.match(/(?:died|death|cause|from|of)\s+([^,.\n]+)/i);
          const cause = causeMatch ? causeMatch[1].trim() : 'Unknown';
          
          deaths.push({
            name: name,
            dateOfDeath: formatIncendarDate(dateStr),
            age: age,
            causeOfDeath: cause,
            source: 'incendar'
          });
        }
      }
    });
    
    // Alternative scraping approach if the above doesn't work
    if (deaths.length === 0) {
      $('p, div').each((i, element) => {
        const text = $(element).text();
        
        // Look for patterns like "Name, age XX, died on..."
        const deathPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:age\s+)?(\d{2,3}),?\s*(?:died|passed)/gi;
        let match;
        
        while ((match = deathPattern.exec(text)) !== null && deaths.length < 20) {
          const name = match[1].trim();
          const age = parseInt(match[2]);
          
          if (name.length > 2) {
            deaths.push({
              name: name,
              dateOfDeath: format(new Date(), 'yyyy-MM-dd'), // Default to today
              age: age,
              causeOfDeath: 'Unknown',
              source: 'incendar'
            });
          }
        }
      });
    }
    
    res.json({ deaths: deaths.slice(0, 30) }); // Limit to 30 results
    
  } catch (error) {
    console.error('Incendar scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape Incendar' });
  }
});

// Helper functions
function getMonthNumber(monthName) {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  return months[monthName] || 0;
}

function extractNameFromText(text) {
  // Extract name from formats like "John Doe, 75, actor and director"
  const nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  return nameMatch ? nameMatch[1] : '';
}

function formatIncendarDate(dateStr) {
  try {
    // Handle various date formats
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (dateStr.includes('-')) {
      return dateStr; // Already in YYYY-MM-DD format
    } else {
      // Handle "Month DD, YYYY" format
      const date = new Date(dateStr);
      return format(date, 'yyyy-MM-dd');
    }
  } catch (error) {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Scraper API running on port ${PORT}`);
});

module.exports = app;
