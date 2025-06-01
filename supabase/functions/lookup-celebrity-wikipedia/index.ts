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
    console.log(`🔍 Starting Wikipedia search for: "${celebrityName}"`);
    
    // Clean the name for searching
    const cleanName = celebrityName
      .replace(/["']/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    console.log(`🧹 Cleaned name: "${cleanName}"`);
    
    // Create comprehensive search variations for wrestlers/performers
    const searchVariations = [];
    
    // Original name variations
    searchVariations.push(cleanName);
    searchVariations.push(cleanName.replace(/\([^)]*\)/g, '').trim()); // Remove parentheses
    searchVariations.push(cleanName.split(' ').slice(0, 2).join(' ')); // First two words
    searchVariations.push(cleanName.replace(/\b(Jr|Sr|III|II)\b/gi, '').trim()); // Remove suffixes
    
    // Extract nickname/stage name variations
    const nicknameMatch = celebrityName.match(/["']([^"']+)["']/);
    if (nicknameMatch) {
      const nickname = nicknameMatch[1];
      searchVariations.push(nickname); // Just the nickname
      searchVariations.push(`${nickname} (wrestler)`); // Nickname + wrestler
      searchVariations.push(`${nickname} (actor)`); // Nickname + actor
      searchVariations.push(`${nickname} (comedian)`); // Nickname + comedian
      searchVariations.push(`${nickname} (performer)`); // Nickname + performer
      
      // Also try without quotes in the original
      const nameWithoutQuotes = cleanName.replace(/["']([^"']+)["']/g, '$1');
      searchVariations.push(nameWithoutQuotes);
    }
    
    // Wrestling-specific variations
    if (cleanName.toLowerCase().includes('black bart')) {
      searchVariations.push('Black Bart (wrestler)');
      searchVariations.push('Black Bart');
      searchVariations.push('Rick Harris wrestler');
      searchVariations.push('Ricky Harris wrestler');
    }
    
    // Add profession-specific searches for common name patterns
    const baseName = cleanName.replace(/["']([^"']+)["']/g, '').trim();
    searchVariations.push(`${baseName} (wrestler)`);
    searchVariations.push(`${baseName} (actor)`);
    searchVariations.push(`${baseName} (comedian)`);
    
    // Remove duplicates and empty entries
    const uniqueVariations = [...new Set(searchVariations)].filter(v => v && v.length > 1);
    
    console.log(`🔄 Search variations:`, uniqueVariations);
    
    for (const variation of uniqueVariations) {
      console.log(`🎯 Trying search variation: "${variation}"`);
      
      try {
        // First, try direct page lookup
        const directUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(variation)}`;
        console.log(`📄 Direct lookup URL: ${directUrl}`);
        
        let response = await fetch(directUrl, {
          headers: {
            'User-Agent': 'DeadpoolGameBot/1.0 (Celebrity Lookup)'
          }
        });
        
        console.log(`📄 Direct lookup response: ${response.status}`);
        
        if (response.ok) {
          const summaryData = await response.json();
          console.log(`✅ Found via direct lookup: "${summaryData.title}"`);
          
          // Get full content and process
          const result = await processWikipediaPage(celebrityName, summaryData);
          if (result) return result;
        }
        
        // Try search API if direct lookup fails
        console.log(`🔍 Direct lookup failed, trying search API...`);
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(variation)}&limit=10&namespace=0&format=json`;
        console.log(`🔍 Search URL: ${searchUrl}`);
        
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        console.log(`🔍 Search results for "${variation}":`, searchData[1]);
        
        if (searchData[1] && searchData[1].length > 0) {
          // Try each search result
          for (const foundTitle of searchData[1]) {
            console.log(`✅ Trying search result: "${foundTitle}"`);
            
            try {
              const pageResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(foundTitle)}`);
              if (pageResponse.ok) {
                const pageData = await pageResponse.json();
                const result = await processWikipediaPage(celebrityName, pageData);
                if (result) return result;
              }
            } catch (pageError) {
              console.log(`❌ Error processing search result "${foundTitle}":`, pageError);
              continue;
            }
          }
        } else {
          console.log(`❌ No search results for "${variation}"`);
        }
        
      } catch (variationError) {
        console.error(`❌ Error trying variation "${variation}":`, variationError);
        continue;
      }
      
      // Small delay between searches to be polite
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`❌ Could not find Wikipedia page for "${celebrityName}" after trying all variations`);
    return null;
    
  } catch (error) {
    console.error(`💥 Fatal error searching Wikipedia for "${celebrityName}":`, error);
    return null;
  }
}

async function processWikipediaPage(originalName: string, summaryData: any): Promise<CelebrityInfo | null> {
  try {
    console.log(`📖 Processing Wikipedia page: "${summaryData.title}"`);
    console.log(`📝 Extract preview: ${summaryData.extract?.substring(0, 100)}...`);
    
    // Get full page content for detailed extraction
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(summaryData.title)}&format=json&prop=text&section=0`;
    console.log(`📖 Getting full content from: ${contentUrl}`);
    
    const contentResponse = await fetch(contentUrl);
    const contentData = await contentResponse.json();
    
    if (!contentData.parse || !contentData.parse.text) {
      console.log(`❌ Could not get content for "${summaryData.title}"`);
      return null;
    }
    
    console.log(`📖 Got page content, length: ${contentData.parse.text['*'].length}`);
    
    const htmlContent = contentData.parse.text['*'];
    
    // Check if this looks like a death-related page for 2025
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Look for recent death indicators
    const deathIndicators = [
      /died.*(january|february|march|april|may|june|july|august|september|october|november|december).*(2025|2024)/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december).*(2025|2024).*died/i,
      /death.*(january|february|march|april|may|june|july|august|september|october|november|december).*(2025|2024)/i,
      /(2025|2024).*(died|death)/i
    ];
    
    const hasRecentDeath = deathIndicators.some(pattern => pattern.test(textContent));
    console.log(`💀 Recent death indicators found: ${hasRecentDeath}`);
    
    const info = extractCelebrityInfo(originalName, htmlContent, summaryData);
    
    // If we found death info or this is clearly the right person, return it
    if (info.dateOfDeath || info.dateOfBirth || hasRecentDeath) {
      console.log(`🎭 Extracted useful info for ${originalName}`);
      return {
        ...info,
        wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(summaryData.title)}`
      };
    }
    
    console.log(`❌ No useful biographical data found for ${originalName} on page ${summaryData.title}`);
    return null;
    
  } catch (error) {
    console.error(`💥 Error processing Wikipedia page:`, error);
    return null;
  }
}

function extractCelebrityInfo(name: string, htmlContent: string, summaryData: any): CelebrityInfo {
  console.log(`🔬 Extracting info for: ${name}`);
  
  // Remove HTML tags for text processing
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`📄 Text content length: ${textContent.length}`);
  console.log(`📄 First 300 chars: ${textContent.substring(0, 300)}`);
  
  let dateOfBirth: string | undefined;
  let dateOfDeath: string | undefined;
  let ageAtDeath: number | undefined;
  let causeOfDeath: string | undefined;
  
  // Enhanced birth date patterns
  const birthPatterns = [
    /born[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /born[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
    /born[:\s]+(\d{4})/i,
    /\(born\s+(\w+\s+\d{1,2},?\s+\d{4})\)/i,
    /\((\w+\s+\d{1,2},?\s+\d{4})\s*[–\-]\s*/i,
    /\b(\w+\s+\d{1,2},?\s+\d{4})\s*[–\-]/i,
    /birth.*?(\w+\s+\d{1,2},?\s+\d{4})/i
  ];
  
  for (const pattern of birthPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      dateOfBirth = standardizeDate(match[1]);
      console.log(`🎂 Found birth date: ${match[1]} → ${dateOfBirth}`);
      break;
    }
  }
  
  // Enhanced death date patterns - especially for 2025 deaths
  const deathPatterns = [
    /died[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /died[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+2025/i,
    /\–\s*(\w+\s+\d{1,2},?\s+\d{4})\)/i,
    /\-\s*(\w+\s+\d{1,2},?\s+\d{4})\)/i,
    /death[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/i,
    /\s+[–\-]\s*(\w+\s+\d{1,2},?\s+\d{4})\)/i,
    /passed away.*?(\w+\s+\d{1,2},?\s+\d{4})/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+(2024|2025)/i
  ];
  
  for (const pattern of deathPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      const dateStr = match[1] || match[0];
      dateOfDeath = standardizeDate(dateStr);
      console.log(`💀 Found death date: ${dateStr} → ${dateOfDeath}`);
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
    console.log(`🎯 Calculated age at death: ${ageAtDeath}`);
  }
  
  // Enhanced cause of death patterns
  const causePatterns = [
    /died (?:of|from|due to)\s+([^.]{10,80})/i,
    /cause of death[:\s]+([^.]{10,80})/i,
    /death was (?:caused by|due to)\s+([^.]{10,80})/i,
    /died following\s+([^.]{10,80})/i,
    /died after\s+([^.]{10,80})/i,
    /passed away (?:from|due to)\s+([^.]{10,80})/i,
    /succumbed to\s+([^.]{10,80})/i
  ];
  
  for (const pattern of causePatterns) {
    const match = textContent.match(pattern);
    if (match) {
      causeOfDeath = match[1].trim().replace(/\s+/g, ' ');
      console.log(`⚰️ Found cause of death: ${causeOfDeath}`);
      break;
    }
  }
  
  // Create funny description - enhanced for wrestlers
  const description = createFunnyDescription(name, summaryData.extract || textContent.substring(0, 500), dateOfDeath, causeOfDeath, summaryData.title);
  console.log(`😄 Created description: ${description.substring(0, 100)}...`);
  
  return {
    name,
    dateOfBirth,
    dateOfDeath,
    ageAtDeath,
    causeOfDeath,
    description
  };
}

function createFunnyDescription(name: string, extract: string, dateOfDeath?: string, causeOfDeath?: string, wikipediaTitle?: string): string {
  const firstSentence = extract.split('.')[0] + '.';
  
  // Check if this is a wrestler
  const isWrestler = wikipediaTitle?.toLowerCase().includes('wrestler') || 
                    extract.toLowerCase().includes('wrestler') || 
                    extract.toLowerCase().includes('wrestling');
  
  const funnyIntros = isWrestler ? [
    `Meet ${name}, who took their final bump`,
    `${name} has been pinned for the three-count permanently`,
    `Former grappler ${name}`,
    `Wrestling legend ${name} has left the ring for good`,
    `${name} has made their final entrance`
  ] : [
    `Meet ${name}, who shuffled off this mortal coil`,
    `${name} has left the building permanently`,
    `Former person ${name}`,
    `Once-living legend ${name}`,
    `Dearly departed ${name}`
  ];
  
  const funnyOutros = isWrestler ? [
    "and this time there's no getting back up.",
    "proving that even the toughest wrestlers can't escape the ultimate submission hold.",
    "in what we can only assume was not a work.",
    "making their final exit through the curtain of life.",
    "and unfortunately, there's no referee to stop this count."
  ] : [
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
  let bioLine = firstSentence.replace(name, 'They were').replace(/^[^,]+,\s*/, 'They were ');
  if (isWrestler) {
    bioLine = bioLine.replace('They were', 'They were a professional wrestler');
  }
  description += ` ${bioLine}`;
  
  return description;
}

function standardizeDate(dateStr: string): string {
  try {
    console.log(`📅 Standardizing date: "${dateStr}"`);
    
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
          const standardized = `${year}-${month}-${day}`;
          console.log(`📅 Manual parse: ${dateStr} → ${standardized}`);
          return standardized;
        }
      }
      console.log(`📅 Could not parse date: ${dateStr}`);
      return dateStr; // Return as-is if we can't parse it
    }
    const standardized = date.toISOString().split('T')[0];
    console.log(`📅 Standard parse: ${dateStr} → ${standardized}`);
    return standardized;
  } catch (error) {
    console.log(`📅 Date parse error for "${dateStr}":`, error);
    return dateStr;
  }
}

async function processCelebrityPicks(supabase: any, logId: string) {
  console.log(`🎬 Starting celebrity picks processing...`);
  
  let celebritiesProcessed = 0;
  let dataUpdated = 0;
  
  // Get all unique celebrity names from picks
  const { data: picks, error } = await supabase
    .from('celebrity_picks')
    .select('celebrity_name')
    .eq('game_year', 2025);
  
  if (error) {
    console.error(`💥 Failed to fetch celebrity picks:`, error);
    throw new Error(`Failed to fetch celebrity picks: ${error.message}`);
  }
  
  console.log(`📋 Found ${picks?.length || 0} total picks`);
  
  // Get unique names
  const uniqueNames = [...new Set(picks.map((pick: any) => pick.celebrity_name))];
  console.log(`🌟 Found ${uniqueNames.length} unique celebrities:`);
  uniqueNames.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
  
  for (const celebrityName of uniqueNames) {
    celebritiesProcessed++;
    console.log(`\n🎭 Processing ${celebritiesProcessed}/${uniqueNames.length}: "${celebrityName}"`);
    
    try {
      // Check if we already have a deceased_celebrities record for this person
      const { data: existing } = await supabase
        .from('deceased_celebrities')
        .select('*')
        .eq('canonical_name', celebrityName)
        .single();
      
      if (existing) {
        console.log(`✅ "${celebrityName}" already exists in deceased_celebrities table`);
        continue;
      }
      
      console.log(`🔍 Looking up "${celebrityName}" on Wikipedia...`);
      const info = await searchWikipedia(celebrityName);
      
      if (info && (info.dateOfDeath || info.dateOfBirth)) {
        console.log(`💾 Saving data for "${celebrityName}"...`);
        
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
          console.error(`💥 Error inserting "${celebrityName}":`, insertError);
        } else {
          console.log(`✅ Successfully added data for "${celebrityName}"`);
          dataUpdated++;
          
          // If person is dead, score matching picks
          if (info.dateOfDeath) {
            console.log(`⚰️ "${celebrityName}" is deceased, scoring picks...`);
            await updateMatchingPicks(supabase, celebrityName, 2025, record);
          }
        }
      } else {
        console.log(`❌ Could not find useful data for "${celebrityName}"`);
      }
      
      // Small delay to be polite to Wikipedia
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`💥 Error processing "${celebrityName}":`, error);
    }
  }
  
  console.log(`\n📊 Processing complete: ${celebritiesProcessed} processed, ${dataUpdated} updated`);
  
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
    console.log(`🎯 Scoring ${picks.length} picks with ${points} points each`);
    
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🚀 Starting Wikipedia celebrity lookup function...`);

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

    console.log(`📝 Created log entry: ${logEntry.id}`);
    
    // Process celebrity picks and lookup missing data
    const { celebritiesProcessed, dataUpdated } = await processCelebrityPicks(supabaseClient, logEntry.id);
    
    // Complete the log
    await supabaseClient
      .from('fetch_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', logEntry.id);
    
    console.log(`🎉 Function completed successfully!`);
    
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
    console.error('💥 Error in Wikipedia celebrity lookup function:', error);
    
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