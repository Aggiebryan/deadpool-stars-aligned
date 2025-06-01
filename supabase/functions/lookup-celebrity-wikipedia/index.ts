
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CelebrityInfo {
  name: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  ageAtDeath?: number;
  causeOfDeath?: string;
  description: string;
  wikipediaUrl?: string;
}

async function searchWikipedia(celebrityName: string): Promise<CelebrityInfo | null> {
  try {
    console.log(`Searching Wikipedia for: ${celebrityName}`);
    
    // First, search for the page
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(celebrityName)}`;
    
    let response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'DeadpoolGameBot/1.0 (Celebrity Lookup)'
      }
    });
    
    if (!response.ok) {
      // Try alternative search if direct lookup fails
      const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(celebrityName)}&limit=1&namespace=0&format=json`;
      const searchResponse = await fetch(searchApiUrl);
      const searchData = await searchResponse.json();
      
      if (searchData[1] && searchData[1].length > 0) {
        const foundTitle = searchData[1][0];
        response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(foundTitle)}`);
      }
      
      if (!response.ok) {
        console.log(`Could not find Wikipedia page for ${celebrityName}`);
        return null;
      }
    }
    
    const summaryData = await response.json();
    console.log(`Found Wikipedia page: ${summaryData.title}`);
    
    // Get full page content for detailed extraction
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(summaryData.title)}&format=json&prop=text&section=0`;
    const contentResponse = await fetch(contentUrl);
    const contentData = await contentResponse.json();
    
    if (!contentData.parse || !contentData.parse.text) {
      console.log(`Could not get content for ${summaryData.title}`);
      return null;
    }
    
    const htmlContent = contentData.parse.text['*'];
    const info = extractCelebrityInfo(celebrityName, htmlContent, summaryData);
    
    return {
      ...info,
      wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(summaryData.title)}`
    };
    
  } catch (error) {
    console.error(`Error searching Wikipedia for ${celebrityName}:`, error);
    return null;
  }
}

function extractCelebrityInfo(name: string, htmlContent: string, summaryData: any): CelebrityInfo {
  // Remove HTML tags for text processing
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  let dateOfBirth: string | undefined;
  let dateOfDeath: string | undefined;
  let ageAtDeath: number | undefined;
  let causeOfDeath: string | undefined;
  
  // Extract birth date - various patterns
  const birthPatterns = [
    /born[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /born[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
    /born[:\s]+(\d{4})/i,
    /\(born\s+(\w+\s+\d{1,2},?\s+\d{4})\)/i,
    /\((\w+\s+\d{1,2},?\s+\d{4})\s*[–\-]\s*/i
  ];
  
  for (const pattern of birthPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      dateOfBirth = standardizeDate(match[1]);
      break;
    }
  }
  
  // Extract death date - various patterns
  const deathPatterns = [
    /died[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /died[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
    /\–\s*(\w+\s+\d{1,2},?\s+\d{4})\)/i,
    /\-\s*(\w+\s+\d{1,2},?\s+\d{4})\)/i,
    /death[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i
  ];
  
  for (const pattern of deathPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      dateOfDeath = standardizeDate(match[1]);
      break;
    }
  }
  
  // Calculate age at death if we have both dates
  if (dateOfBirth && dateOfDeath) {
    const birth = new Date(dateOfBirth);
    const death = new Date(dateOfDeath);
    ageAtDeath = death.getFullYear() - birth.getFullYear();
    if (death.getMonth() < birth.getMonth() || 
        (death.getMonth() === birth.getMonth() && death.getDate() < birth.getDate())) {
      ageAtDeath--;
    }
  }
  
  // Extract cause of death
  const causePatterns = [
    /died (?:of|from|due to)\s+([^.]{10,80})/i,
    /cause of death[:\s]+([^.]{10,80})/i,
    /death was (?:caused by|due to)\s+([^.]{10,80})/i,
    /died following\s+([^.]{10,80})/i,
    /died after\s+([^.]{10,80})/i
  ];
  
  for (const pattern of causePatterns) {
    const match = textContent.match(pattern);
    if (match) {
      causeOfDeath = match[1].trim().replace(/\s+/g, ' ');
      break;
    }
  }
  
  // Create funny description
  const description = createFunnyDescription(name, summaryData.extract || textContent.substring(0, 500), dateOfDeath, causeOfDeath);
  
  return {
    name,
    dateOfBirth,
    dateOfDeath,
    ageAtDeath,
    causeOfDeath,
    description
  };
}

function standardizeDate(dateStr: string): string {
  try {
    // Handle various date formats and convert to YYYY-MM-DD
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try to parse manually for formats like "January 15, 1990"
      const monthNames = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
        'oct': '10', 'nov': '11', 'dec': '12'
      };
      
      const parts = dateStr.toLowerCase().replace(/,/g, '').split(/\s+/);
      if (parts.length >= 3) {
        const month = monthNames[parts[0] as keyof typeof monthNames];
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        if (month) {
          return `${year}-${month}-${day}`;
        }
      }
      return dateStr; // Return as-is if we can't parse it
    }
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

function createFunnyDescription(name: string, extract: string, dateOfDeath?: string, causeOfDeath?: string): string {
  const firstSentence = extract.split('.')[0] + '.';
  
  const funnyIntros = [
    `Meet ${name}, who shuffled off this mortal coil`,
    `${name} has left the building permanently`,
    `Former person ${name}`,
    `Once-living legend ${name}`,
    `Dearly departed ${name}`
  ];
  
  const funnyOutros = [
    "and probably didn't see it coming.",
    "because apparently life had other plans.",
    "proving that even celebrities can't cheat death.",
    "in what we can only assume was not part of their five-year plan.",
    "making their final exit from the stage of life."
  ];
  
  let description = funnyIntros[Math.floor(Math.random() * funnyIntros.length)];
  
  if (dateOfDeath) {
    description += ` on ${dateOfDeath}`;
  }
  
  if (causeOfDeath) {
    description += ` from ${causeOfDeath.toLowerCase()}`;
  }
  
  description += ` ${funnyOutros[Math.floor(Math.random() * funnyOutros.length)]}`;
  
  // Add a brief bio line
  const bioLine = firstSentence.replace(name, 'They were').replace(/^[^,]+,\s*/, 'They were ');
  description += ` ${bioLine}`;
  
  return description;
}

async function processCelebrityPicks(supabase: any, logId: string) {
  let celebritiesProcessed = 0;
  let dataUpdated = 0;
  
  // Get all unique celebrity names from picks
  const { data: picks, error } = await supabase
    .from('celebrity_picks')
    .select('celebrity_name')
    .eq('game_year', 2025);
  
  if (error) {
    throw new Error(`Failed to fetch celebrity picks: ${error.message}`);
  }
  
  // Get unique names
  const uniqueNames = [...new Set(picks.map((pick: any) => pick.celebrity_name))];
  console.log(`Found ${uniqueNames.length} unique celebrities to look up`);
  
  for (const celebrityName of uniqueNames) {
    celebritiesProcessed++;
    
    try {
      // Check if we already have a deceased_celebrities record for this person
      const { data: existing } = await supabase
        .from('deceased_celebrities')
        .select('*')
        .eq('canonical_name', celebrityName)
        .single();
      
      if (existing) {
        console.log(`${celebrityName} already exists in deceased_celebrities table`);
        continue;
      }
      
      console.log(`Looking up ${celebrityName} on Wikipedia...`);
      const info = await searchWikipedia(celebrityName);
      
      if (info && (info.dateOfDeath || info.dateOfBirth)) {
        // Only create record if we found useful data
        const record = {
          canonical_name: celebrityName,
          date_of_birth: info.dateOfBirth || null,
          date_of_death: info.dateOfDeath || null,
          age_at_death: info.ageAtDeath || null,
          cause_of_death_category: categorizeDeathCause(info.causeOfDeath),
          cause_of_death_details: info.causeOfDeath || null,
          game_year: 2025,
          source_url: info.wikipediaUrl || null,
          died_on_birthday: false,
          died_on_major_holiday: false,
          died_during_public_event: false,
          died_in_extreme_sport: false,
          is_first_death_of_year: false,
          is_last_death_of_year: false,
          is_approved: info.dateOfDeath ? false : true, // Auto-approve if no death date (living person)
          celebrity_description: info.description
        };
        
        const { error: insertError } = await supabase
          .from('deceased_celebrities')
          .insert(record);
        
        if (insertError) {
          console.error(`Error inserting ${celebrityName}:`, insertError);
        } else {
          console.log(`Successfully added data for ${celebrityName}`);
          dataUpdated++;
          
          // If person is dead, score matching picks
          if (info.dateOfDeath) {
            await updateMatchingPicks(supabase, celebrityName, 2025, record);
          }
        }
      } else {
        console.log(`Could not find useful data for ${celebrityName}`);
      }
      
      // Small delay to be polite to Wikipedia
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error processing ${celebrityName}:`, error);
    }
  }
  
  // Update log
  await supabase
    .from('fetch_logs')
    .update({
      deaths_found: celebritiesProcessed,
      deaths_added: dataUpdated
    })
    .eq('id', logId);
  
  return { celebritiesProcessed, dataUpdated };
}

function categorizeDeathCause(cause?: string): string {
  if (!cause) return 'Unknown';
  
  const causeLower = cause.toLowerCase();
  
  if (causeLower.includes('cancer') || causeLower.includes('heart') || 
      causeLower.includes('stroke') || causeLower.includes('natural')) {
    return 'Natural';
  } else if (causeLower.includes('suicide')) {
    return 'Suicide';
  } else if (causeLower.includes('accident') || causeLower.includes('crash') || 
             causeLower.includes('fall') || causeLower.includes('collision')) {
    return 'Accidental';
  } else if (causeLower.includes('murder') || causeLower.includes('shot') || 
             causeLower.includes('killed') || causeLower.includes('homicide')) {
    return 'Violent';
  } else if (causeLower.includes('overdose') || causeLower.includes('drug') ||
             causeLower.includes('poisoning')) {
    return 'RareOrUnusual';
  } else if (causeLower.includes('covid') || causeLower.includes('pandemic') ||
             causeLower.includes('virus')) {
    return 'PandemicOrOutbreak';
  }
  
  return 'Unknown';
}

async function updateMatchingPicks(supabase: any, celebrityName: string, gameYear: number, deceased: any): Promise<number> {
  const { data: picks } = await supabase
    .from('celebrity_picks')
    .select('*')
    .eq('celebrity_name', celebrityName)
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
      
      // Update user's total score
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
  const age = deceased.age_at_death || 75;
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
  console.log('Edge function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing request...');
    
    // Parse request body
    let requestBody = {};
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (e) {
      console.log('No request body or invalid JSON');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create log entry
    console.log('Creating log entry...');
    const { data: logEntry, error: logError } = await supabaseClient
      .from('fetch_logs')
      .insert({
        status: 'running',
        deaths_found: 0,
        deaths_added: 0,
        picks_scored: 0
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating log entry:', logError);
      throw logError;
    }

    console.log('Log entry created:', logEntry.id);
    console.log('Starting Wikipedia celebrity lookup process...');
    
    // Process celebrity picks and lookup missing data
    const { celebritiesProcessed, dataUpdated } = await processCelebrityPicks(supabaseClient, logEntry.id);
    
    console.log(`Processed ${celebritiesProcessed} celebrities, updated ${dataUpdated} records`);
    
    // Complete the log
    await supabaseClient
      .from('fetch_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', logEntry.id);
    
    console.log('Wikipedia lookup completed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        celebritiesProcessed,
        dataUpdated,
        source: 'Wikipedia Celebrity Lookup',
        message: `Processed ${celebritiesProcessed} celebrities, updated ${dataUpdated} records with Wikipedia data` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in Wikipedia celebrity lookup function:', error);
    
    // Update log with error
    try {
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
    } catch (logUpdateError) {
      console.error('Error updating log:', logUpdateError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
