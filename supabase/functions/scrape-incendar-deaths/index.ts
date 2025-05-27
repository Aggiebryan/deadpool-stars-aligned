import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CelebrityDeath {
  name: string;
  dateOfDeath: string;
  age?: number;
  cause?: string;
}

async function scrapeIncendarDeaths(): Promise<CelebrityDeath[]> {
  try {
    console.log('Fetching from Incendar deaths page...');
    const response = await fetch('https://incendar.com/deathclock-recent-high-profile-media-famous-deaths-in-us-united-states.php');
    const html = await response.text();
    
    console.log('HTML length:', html.length);
    
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const deaths: CelebrityDeath[] = [];
    
    // Try multiple selectors to find death entries
    const possibleSelectors = [
      'table tr',
      'tbody tr', 
      '.death-entry',
      '.celebrity-death',
      'tr',
      'div[class*="death"]',
      'div[class*="celebrity"]',
      'li',
      'p'
    ];
    
    let foundElements = 0;
    
    for (const selector of possibleSelectors) {
      const elements = doc.querySelectorAll(selector);
      console.log(`Selector "${selector}" found ${elements.length} elements`);
      
      if (elements.length > foundElements) {
        foundElements = elements.length;
        
        // Process elements with this selector
        for (let i = 0; i < Math.min(elements.length, 100); i++) { // Limit to prevent too much logging
          const element = elements[i];
          const text = element.textContent || '';
          
          // Skip very short text or headers
          if (text.length < 10) continue;
          
          console.log(`Element ${i} text:`, text.substring(0, 200));
          
          try {
            // Try to parse death information from text
            const death = parseDeathFromText(text);
            if (death) {
              deaths.push(death);
              console.log('Parsed death:', death);
            }
          } catch (error) {
            // Continue processing other elements
            continue;
          }
        }
        
        // If we found deaths with this selector, use them
        if (deaths.length > 0) {
          console.log(`Successfully parsed ${deaths.length} deaths using selector: ${selector}`);
          break;
        }
      }
    }
    
    // If no structured parsing worked, try to find patterns in the entire text
    if (deaths.length === 0) {
      console.log('No deaths found with selectors, trying full text parsing...');
      const fullText = doc.body?.textContent || '';
      console.log('Full text length:', fullText.length);
      
      // Look for death patterns in the full text
      const deathPatterns = parseDeathsFromFullText(fullText);
      deaths.push(...deathPatterns);
    }
    
    console.log(`Total deaths found: ${deaths.length}`);
    return deaths;
  } catch (error) {
    console.error('Error scraping Incendar:', error);
    return [];
  }
}

function parseDeathFromText(text: string): CelebrityDeath | null {
  // Clean up text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Multiple parsing strategies
  const strategies = [
    // Strategy 1: "Name, Age, Date" format
    {
      regex: /^([^,]+),\s*(?:age\s*)?(\d+),?\s*(.+)$/i,
      nameIndex: 1,
      ageIndex: 2,
      dateIndex: 3
    },
    // Strategy 2: "Name (Age) - Date" format
    {
      regex: /^([^(]+)\s*\((\d+)\)\s*[-–]\s*(.+)$/,
      nameIndex: 1,
      ageIndex: 2,
      dateIndex: 3
    },
    // Strategy 3: "Name - Age - Date" format
    {
      regex: /^([^-]+)\s*[-–]\s*(\d+)\s*[-–]\s*(.+)$/,
      nameIndex: 1,
      ageIndex: 2,
      dateIndex: 3
    },
    // Strategy 4: Date first "Date: Name, Age"
    {
      regex: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\w+\s+\d{1,2},?\s+\d{4}).*?([A-Z][^,]+),?\s*(?:age\s*)?(\d+)/i,
      nameIndex: 2,
      ageIndex: 3,
      dateIndex: 1
    },
    // Strategy 5: Just name and age, look for date nearby
    {
      regex: /([A-Z][a-zA-Z\s]+[a-zA-Z]),?\s*(?:age\s*)?(\d+)/,
      nameIndex: 1,
      ageIndex: 2,
      dateIndex: 0 // Will look for date separately
    }
  ];
  
  for (const strategy of strategies) {
    const match = cleanText.match(strategy.regex);
    if (match) {
      const name = match[strategy.nameIndex]?.trim();
      const ageStr = match[strategy.ageIndex];
      const dateStr = strategy.dateIndex > 0 ? match[strategy.dateIndex]?.trim() : null;
      
      if (name && ageStr) {
        const age = parseInt(ageStr);
        if (age > 0 && age < 150) { // Reasonable age range
          let dateOfDeath: string | null = null;
          
          if (dateStr) {
            dateOfDeath = parseDate(dateStr);
          } else {
            // Look for date in the surrounding text
            const dateMatch = cleanText.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\w+\s+\d{1,2},?\s+\d{4})/);
            if (dateMatch) {
              dateOfDeath = parseDate(dateMatch[1]);
            }
          }
          
          if (dateOfDeath) {
            return {
              name: name.replace(/[^\w\s]/g, '').trim(),
              dateOfDeath,
              age
            };
          }
        }
      }
    }
  }
  
  return null;
}

function parseDeathsFromFullText(fullText: string): CelebrityDeath[] {
  const deaths: CelebrityDeath[] = [];
  
  // Split text into lines and try to find death entries
  const lines = fullText.split('\n').filter(line => line.trim().length > 10);
  
  for (const line of lines) {
    const death = parseDeathFromText(line);
    if (death) {
      deaths.push(death);
    }
  }
  
  return deaths;
}

function parseDate(dateStr: string): string | null {
  try {
    // Remove extra whitespace and clean up
    const cleaned = dateStr.trim().replace(/\s+/g, ' ');
    
    // Try different date formats
    const formats = [
      // MM/DD/YYYY or MM-DD-YYYY
      /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
      // Month DD, YYYY
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
      // DD Month YYYY
      /(\d{1,2})\s+(\w+)\s+(\d{4})/
    ];
    
    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        let date: Date;
        
        if (format === formats[0]) { // MM/DD/YYYY format
          const month = parseInt(match[1]);
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);
          date = new Date(year, month - 1, day);
        } else { // Text month formats
          date = new Date(cleaned);
        }
        
        if (!isNaN(date.getTime()) && date.getFullYear() >= 2020) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    // Fallback: try direct parsing
    const directDate = new Date(cleaned);
    if (!isNaN(directDate.getTime()) && directDate.getFullYear() >= 2020) {
      return directDate.toISOString().split('T')[0];
    }
  } catch (error) {
    console.log('Date parsing error for:', dateStr, error);
  }
  
  return null;
}

async function processDeaths(supabase: any, deaths: CelebrityDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
    if (!death.age) continue; // Skip if no age available

    // Check if already exists
    const { data: existing } = await supabase
      .from('deceased_celebrities')
      .select('id')
      .eq('canonical_name', death.name)
      .eq('date_of_death', death.dateOfDeath)
      .single();
    
    if (!existing) {
      // Calculate additional fields
      const dateOfDeath = new Date(death.dateOfDeath);
      const gameYear = dateOfDeath.getFullYear();
      
      // Insert new death record
      const { data: newDeath, error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.name,
          date_of_death: death.dateOfDeath,
          age_at_death: death.age,
          cause_of_death_category: 'Unknown',
          cause_of_death_details: death.cause || null,
          game_year: gameYear,
          source_url: 'https://incendar.com/deathclock-recent-high-profile-media-famous-deaths-in-us-united-states.php',
          died_on_birthday: false,
          died_on_major_holiday: false,
          died_during_public_event: false,
          died_in_extreme_sport: false,
          is_first_death_of_year: false,
          is_last_death_of_year: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting death:', error);
      } else {
        console.log(`Inserted death record for ${death.name}`);
        deathsAdded++;
        
        // Update any matching picks
        const scored = await updateMatchingPicks(supabase, death.name, gameYear, newDeath);
        picksScored += scored;
      }
    }
  }

  // Update log with results
  await supabase
    .from('fetch_logs')
    .update({
      deaths_added: deathsAdded,
      picks_scored: picksScored
    })
    .eq('id', logId);

  return { deathsAdded, picksScored };
}

async function updateMatchingPicks(supabase: any, celebrityName: string, gameYear: number, deceased: any): Promise<number> {
  // Find matching picks (case-insensitive)
  const { data: picks } = await supabase
    .from('celebrity_picks')
    .select('*')
    .ilike('celebrity_name', celebrityName)
    .eq('game_year', gameYear)
    .eq('is_hit', false);
  
  if (picks && picks.length > 0) {
    const points = calculatePoints(deceased);
    
    // Update picks and user scores
    for (const pick of picks) {
      await supabase
        .from('celebrity_picks')
        .update({
          is_hit: true,
          points_awarded: points
        })
        .eq('id', pick.id);
      
      // Update user total score
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_score')
        .eq('id', pick.user_id)
        .single();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_score: profile.total_score + points
          })
          .eq('id', pick.user_id);
      }
    }
    
    return picks.length;
  }
  
  return 0;
}

function calculatePoints(deceased: any): number {
  let points = 0;
  const age = deceased.age_at_death;
  const cause = deceased.cause_of_death_category;
  
  // Base points
  points += (100 - age);
  
  // Cause bonuses
  switch (cause) {
    case 'Natural':
      points += age >= 80 ? 5 : 10;
      break;
    case 'Accidental':
      points += age >= 80 ? 15 : 25;
      break;
    case 'Violent':
      points += age >= 80 ? 30 : 50;
      break;
    case 'Suicide':
      points += age >= 80 ? 20 : 40;
      break;
    case 'RareOrUnusual':
      points += 50;
      break;
    case 'PandemicOrOutbreak':
      points += age >= 80 ? 20 : 35;
      break;
    default:
      points += 5; // Unknown cause gets minimal bonus
      break;
  }
  
  // Special bonuses
  if (deceased.died_on_birthday) points += 15;
  if (deceased.died_on_major_holiday) points += 10;
  if (deceased.died_during_public_event) points += 25;
  if (deceased.died_in_extreme_sport) points += 30;
  if (deceased.is_first_death_of_year) points += 10;
  if (deceased.is_last_death_of_year) points += 10;
  
  return Math.max(points, 0);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create log entry
    const { data: logEntry } = await supabaseClient
      .from('fetch_logs')
      .insert({
        status: 'running',
        deaths_found: 0,
        deaths_added: 0,
        picks_scored: 0
      })
      .select()
      .single();

    console.log('Starting Incendar death scrape process...');
    
    // Scrape deaths from Incendar
    const deaths = await scrapeIncendarDeaths();
    
    console.log(`Found ${deaths.length} deaths from Incendar`);
    
    // Update log with deaths found
    await supabaseClient
      .from('fetch_logs')
      .update({
        deaths_found: deaths.length
      })
      .eq('id', logEntry.id);
    
    // Process and store deaths (filter for recent years, not just 2025)
    const recentDeaths = deaths.filter(death => {
      const deathYear = new Date(death.dateOfDeath).getFullYear();
      return deathYear >= 2024; // Include 2024 and 2025
    });
    
    console.log(`Filtered to ${recentDeaths.length} recent deaths (2024+)`);
    
    const { deathsAdded, picksScored } = await processDeaths(supabaseClient, recentDeaths, logEntry.id);
    
    // Complete the log
    await supabaseClient
      .from('fetch_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', logEntry.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        totalDeaths: deaths.length,
        recentDeaths: recentDeaths.length,
        deathsAdded,
        picksScored,
        source: 'Incendar',
        message: 'Celebrity deaths scraped successfully from Incendar' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in scrape-incendar-deaths function:', error);
    
    // Update log with error
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    await supabaseClient
      .from('fetch_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
