import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CelebrityDeath {
  name: string;
  dateOfDeath: string;
  age?: number;
  cause?: string;
  sourceUrl: string;
}

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
}

async function fetchFromRSSFeed(feed: RSSFeed, sinceDate: string): Promise<CelebrityDeath[]> {
  try {
    console.log(`Fetching from ${feed.name}: ${feed.url}`);
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DeathBot/1.0)'
      }
    });
    
    if (!response.ok) {
      console.log(`HTTP error ${response.status} for ${feed.name}`);
      return [];
    }
    
    const xmlText = await response.text();
    console.log(`Received ${xmlText.length} characters from ${feed.name}`);
    
    // Parse RSS XML with improved parsing
    const items = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];
    console.log(`Found ${items.length} items in ${feed.name}`);
    
    const deaths: CelebrityDeath[] = [];
    const cutoffDate = new Date(sinceDate);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        const death = parseRSSItem(item, feed.url, cutoffDate);
        if (death) {
          deaths.push(death);
          console.log(`Parsed death from ${feed.name}:`, death);
        }
      } catch (error) {
        console.log(`Error parsing item ${i} from ${feed.name}:`, error.message);
        continue;
      }
    }
    
    console.log(`Extracted ${deaths.length} deaths from ${feed.name}`);
    return deaths;
  } catch (error) {
    console.error(`Error fetching from ${feed.name}:`, error);
    return [];
  }
}

function parseRSSItem(item: string, sourceUrl: string, cutoffDate: Date): CelebrityDeath | null {
  // Extract basic RSS fields
  const titleMatch = item.match(/<title(?:\s[^>]*)?>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/is);
  const linkMatch = item.match(/<link(?:\s[^>]*)?>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/is);
  const pubDateMatch = item.match(/<pubDate(?:\s[^>]*)?>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/is);
  const descriptionMatch = item.match(/<description(?:\s[^>]*)?>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/is);
  
  if (!titleMatch) {
    return null;
  }
  
  const title = titleMatch[1].trim();
  const link = linkMatch ? linkMatch[1].trim() : sourceUrl;
  const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : '';
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';
  
  console.log('Parsing RSS item:', { title, pubDateStr });
  
  // Check if this is about a death
  const deathKeywords = ['dies', 'died', 'dead', 'death', 'obituary', 'passes away', 'passed away', 'funeral'];
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  
  const isDeathRelated = deathKeywords.some(keyword => 
    titleLower.includes(keyword) || descLower.includes(keyword)
  );
  
  if (!isDeathRelated) {
    return null;
  }
  
  // Parse publication date
  let pubDate: Date;
  try {
    pubDate = new Date(pubDateStr);
    if (isNaN(pubDate.getTime())) {
      pubDate = new Date(); // Use current date if parsing fails
    }
  } catch {
    pubDate = new Date();
  }
  
  // Only process recent items
  if (pubDate < cutoffDate) {
    return null;
  }
  
  // Extract name and age from title and description
  const fullText = `${title} ${description}`;
  
  // Multiple strategies to extract name and age
  const nameAgePatterns = [
    // "John Doe, 75, dies"
    /([A-Z][a-zA-Z\s'-]+[a-zA-Z]),\s*(\d+),?\s*(?:dies|died|dead)/i,
    // "John Doe dies at 75"
    /([A-Z][a-zA-Z\s'-]+[a-zA-Z])\s+(?:dies|died)\s+at\s+(\d+)/i,
    // "John Doe, age 75"
    /([A-Z][a-zA-Z\s'-]+[a-zA-Z]),\s*age\s+(\d+)/i,
    // "75-year-old John Doe"
    /(\d+)[-\s]year[-\s]old\s+([A-Z][a-zA-Z\s'-]+[a-zA-Z])/i,
    // "John Doe (75)"
    /([A-Z][a-zA-Z\s'-]+[a-zA-Z])\s*\((\d+)\)/i,
    // "Death of John Doe, 75"
    /death of\s+([A-Z][a-zA-Z\s'-]+[a-zA-Z]),\s*(\d+)/i
  ];
  
  let name = '';
  let age = 0;
  
  for (const pattern of nameAgePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      if (pattern.source.startsWith('(\\d+)')) {
        // Age comes first
        age = parseInt(match[1]);
        name = match[2].trim();
      } else {
        // Name comes first
        name = match[1].trim();
        age = parseInt(match[2]);
      }
      
      // Validate
      if (name.length >= 3 && age > 0 && age <= 120) {
        break;
      }
    }
  }
  
  // If no age found, try to extract just the name
  if (!name || age === 0) {
    const nameOnlyPatterns = [
      /([A-Z][a-zA-Z\s'-]+[a-zA-Z])\s+(?:dies|died|dead)/i,
      /death of\s+([A-Z][a-zA-Z\s'-]+[a-zA-Z])/i,
      /obituary:\s*([A-Z][a-zA-Z\s'-]+[a-zA-Z])/i
    ];
    
    for (const pattern of nameOnlyPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        name = match[1].trim();
        if (name.length >= 3) {
          break;
        }
      }
    }
  }
  
  if (!name || name.length < 3) {
    console.log('Could not extract valid name from:', title);
    return null;
  }
  
  // Clean up the name
  name = name.replace(/[^\w\s'-]/g, '').trim();
  
  // Extract cause of death
  let cause = '';
  const causePatterns = [
    /(?:died|death)\s+(?:from|of|due to)\s+([^,.]+)/i,
    /cause of death[:\s]+([^,.]+)/i,
    /following\s+(?:a\s+)?([^,.]+)/i
  ];
  
  for (const pattern of causePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      cause = match[1].trim();
      break;
    }
  }
  
  return {
    name,
    dateOfDeath: pubDate.toISOString().split('T')[0],
    age: age > 0 ? age : undefined,
    cause: cause || undefined,
    sourceUrl: link
  };
}

async function processDeaths(supabase: any, deaths: CelebrityDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
    // Skip if no age and no name of sufficient length
    if (!death.age && death.name.length < 5) continue;

    // Check if already exists
    const { data: existing } = await supabase
      .from('deceased_celebrities')
      .select('id')
      .eq('canonical_name', death.name)
      .eq('date_of_death', death.dateOfDeath)
      .single();
    
    if (!existing) {
      const dateOfDeath = new Date(death.dateOfDeath);
      const gameYear = dateOfDeath.getFullYear();
      
      // Map cause to category
      let causeCategory = 'Unknown';
      const cause = death.cause?.toLowerCase() || '';
      
      if (cause.includes('cancer') || cause.includes('heart') || cause.includes('natural')) {
        causeCategory = 'Natural';
      } else if (cause.includes('suicide')) {
        causeCategory = 'Suicide';
      } else if (cause.includes('accident') || cause.includes('crash') || cause.includes('fall')) {
        causeCategory = 'Accidental';
      } else if (cause.includes('murder') || cause.includes('shot') || cause.includes('killed')) {
        causeCategory = 'Violent';
      } else if (cause.includes('overdose') || cause.includes('drug')) {
        causeCategory = 'RareOrUnusual';
      }
      
      // Insert new death record
      const { data: newDeath, error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.name,
          date_of_death: death.dateOfDeath,
          age_at_death: death.age || null,
          cause_of_death_category: causeCategory,
          cause_of_death_details: death.cause || null,
          game_year: gameYear,
          source_url: death.sourceUrl,
          died_on_birthday: false,
          died_on_major_holiday: await checkIfHoliday(supabase, death.dateOfDeath, gameYear),
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
        
        const scored = await updateMatchingPicks(supabase, death.name, gameYear, newDeath);
        picksScored += scored;
      }
    }
  }

  await supabase
    .from('fetch_logs')
    .update({
      deaths_added: deathsAdded,
      picks_scored: picksScored
    })
    .eq('id', logId);

  return { deathsAdded, picksScored };
}

async function checkIfHoliday(supabase: any, dateOfDeath: string, gameYear: number): Promise<boolean> {
  const { data } = await supabase
    .from('holidays')
    .select('id')
    .eq('date', dateOfDeath)
    .eq('game_year', gameYear)
    .single();
  
  return !!data;
}

async function updateMatchingPicks(supabase: any, celebrityName: string, gameYear: number, deceased: any): Promise<number> {
  const { data: picks } = await supabase
    .from('celebrity_picks')
    .select('*')
    .ilike('celebrity_name', celebrityName)
    .eq('game_year', gameYear)
    .eq('is_hit', false);
  
  if (picks && picks.length > 0) {
    const points = calculatePoints(deceased);
    
    for (const pick of picks) {
      await supabase
        .from('celebrity_picks')
        .update({
          is_hit: true,
          points_awarded: points
        })
        .eq('id', pick.id);
      
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
  const age = deceased.age_at_death || 75; // Default age if missing
  const cause = deceased.cause_of_death_category;
  
  points += (100 - age);
  
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
      points += 5;
      break;
  }
  
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

    console.log('Starting celebrity death fetch process...');
    
    // Get active RSS feeds from database
    const { data: rssFeeds } = await supabaseClient
      .from('rss_feeds')
      .select('*')
      .eq('is_active', true);

    if (!rssFeeds || rssFeeds.length === 0) {
      throw new Error('No active RSS feeds found');
    }

    // Set cutoff date to January 1, 2024 for broader scanning
    const cutoffDate = '2024-01-01T00:00:00Z';
    console.log(`Fetching celebrity deaths since ${cutoffDate}`);

    let allDeaths: CelebrityDeath[] = [];
    
    // Fetch from all active RSS feeds
    for (const feed of rssFeeds) {
      const deaths = await fetchFromRSSFeed(feed, cutoffDate);
      allDeaths = allDeaths.concat(deaths);
    }

    // Remove duplicates based on name and date
    const uniqueDeaths = allDeaths.filter((death, index, self) => 
      index === self.findIndex(d => 
        d.name.toLowerCase() === death.name.toLowerCase() && 
        d.dateOfDeath === death.dateOfDeath
      )
    );

    console.log(`Found ${uniqueDeaths.length} unique deaths from ${rssFeeds.length} RSS feeds since ${cutoffDate}`);
    
    // Update log with deaths found
    await supabaseClient
      .from('fetch_logs')
      .update({
        deaths_found: uniqueDeaths.length
      })
      .eq('id', logEntry.id);
    
    // Process and store deaths
    const { deathsAdded, picksScored } = await processDeaths(supabaseClient, uniqueDeaths, logEntry.id);
    
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
        totalDeaths: uniqueDeaths.length,
        deathsAdded,
        picksScored,
        feedsProcessed: rssFeeds.length,
        cutoffDate,
        message: 'Celebrity deaths updated successfully from RSS feeds' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in fetch-celebrity-deaths function:', error);
    
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
