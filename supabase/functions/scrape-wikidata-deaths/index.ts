
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WikidataDeath {
  name: string;
  dateOfDeath: string;
  age?: number;
  cause?: string;
  occupation?: string;
  wikidataId: string;
}

async function queryWikidataDeaths(targetDate: string): Promise<WikidataDeath[]> {
  try {
    console.log(`Querying Wikidata for deaths on: ${targetDate}`);
    
    const query = `
    SELECT ?person ?personLabel ?dateOfDeath ?dateOfBirth ?causeOfDeathLabel ?occupationLabel WHERE {
      ?person wdt:P31 wd:Q5 ;
              wdt:P570 ?dateOfDeath .
      
      FILTER(STRSTARTS(STR(?dateOfDeath), "${targetDate}"))

      OPTIONAL { ?person wdt:P569 ?dateOfBirth . }
      OPTIONAL { 
        ?person wdt:P509 ?causeOfDeathEntity .
        ?causeOfDeathEntity rdfs:label ?causeOfDeathLabel .
        FILTER(LANG(?causeOfDeathLabel) = "en")
      }
      OPTIONAL {
        ?person wdt:P106 ?occupationEntity .
        ?occupationEntity rdfs:label ?occupationLabel .
        FILTER(LANG(?occupationLabel) = "en")
      }
      
      FILTER EXISTS { ?person wdt:P106 ?someOccupation . }
      FILTER EXISTS { ?person rdfs:label ?someLabel . FILTER(LANG(?someLabel) = "en") }

      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    LIMIT 100`;

    const encodedQuery = encodeURIComponent(query);
    const url = `https://query.wikidata.org/sparql?query=${encodedQuery}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DeadpoolGameBot/1.0 (Celebrity Death Tracking)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`HTTP error ${response.status} from Wikidata`);
      return [];
    }
    
    const data = await response.json();
    const deaths: WikidataDeath[] = [];
    
    for (const result of data.results.bindings) {
      const name = result.personLabel?.value;
      const dodStr = result.dateOfDeath?.value;
      const dobStr = result.dateOfBirth?.value;
      const cause = result.causeOfDeathLabel?.value;
      const occupation = result.occupationLabel?.value;
      const wikidataId = result.person?.value;
      
      if (!name || !dodStr) continue;
      
      let age = undefined;
      if (dobStr && dodStr) {
        try {
          const dob = new Date(dobStr);
          const dod = new Date(dodStr);
          age = dod.getFullYear() - dob.getFullYear();
          if (dod.getMonth() < dob.getMonth() || 
              (dod.getMonth() === dob.getMonth() && dod.getDate() < dob.getDate())) {
            age--;
          }
        } catch (error) {
          console.log(`Could not calculate age for ${name}`);
        }
      }
      
      // Map Wikidata causes to our categories
      let causeCategory = 'Unknown';
      if (cause) {
        const causeLower = cause.toLowerCase();
        if (causeLower.includes('cancer') || causeLower.includes('heart') || 
            causeLower.includes('natural') || causeLower.includes('disease')) {
          causeCategory = 'Natural';
        } else if (causeLower.includes('suicide')) {
          causeCategory = 'Suicide';
        } else if (causeLower.includes('accident') || causeLower.includes('crash')) {
          causeCategory = 'Accidental';
        } else if (causeLower.includes('murder') || causeLower.includes('homicide')) {
          causeCategory = 'Violent';
        } else if (causeLower.includes('overdose') || causeLower.includes('drug')) {
          causeCategory = 'RareOrUnusual';
        }
      }
      
      deaths.push({
        name,
        dateOfDeath: dodStr.split('T')[0],
        age,
        cause: causeCategory,
        occupation,
        wikidataId
      });
      
      console.log(`Found death: ${name}, age ${age}, cause: ${cause}`);
    }
    
    console.log(`Extracted ${deaths.length} deaths from Wikidata`);
    return deaths;
    
  } catch (error) {
    console.error('Error querying Wikidata:', error);
    return [];
  }
}

async function processDeaths(supabase: any, deaths: WikidataDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
    if (!death.age || death.age < 1 || death.age > 120) continue;

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
      
      // Insert new death record
      const { data: newDeath, error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.name,
          date_of_death: death.dateOfDeath,
          age_at_death: death.age,
          cause_of_death_category: death.cause || 'Unknown',
          cause_of_death_details: death.occupation ? `${death.occupation}` : null,
          game_year: gameYear,
          source_url: death.wikidataId,
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

    console.log('Starting Wikidata death query process...');
    
    // Query for deaths in the last 30 days
    const today = new Date();
    const dates = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    let allDeaths: WikidataDeath[] = [];
    
    // Query each date (with small delays to be polite)
    for (const date of dates) {
      const deaths = await queryWikidataDeaths(date);
      allDeaths = allDeaths.concat(deaths);
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Remove duplicates
    const uniqueDeaths = allDeaths.filter((death, index, self) => 
      index === self.findIndex(d => 
        d.name === death.name && d.dateOfDeath === death.dateOfDeath
      )
    );
    
    console.log(`Found ${uniqueDeaths.length} unique deaths from Wikidata`);
    
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
        source: 'Wikidata',
        message: 'Celebrity deaths queried successfully from Wikidata' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in scrape-wikidata-deaths function:', error);
    
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
