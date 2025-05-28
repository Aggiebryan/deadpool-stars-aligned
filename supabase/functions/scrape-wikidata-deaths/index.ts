
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WikidataDeath {
  canonical_name: string;
  date_of_birth: string;
  date_of_death: string;
  cause_of_death_details?: string;
  age?: number;
}

async function queryWikidataDeaths(startDate: string, endDate: string): Promise<WikidataDeath[]> {
  try {
    console.log(`Querying Wikidata for deaths between: ${startDate} and ${endDate}`);
    
    const query = `
    SELECT ?person ?canonical_name ?date_of_birth ?date_of_death ?cause_of_death_details WHERE {
      ?person wdt:P31 wd:Q5;                      # instance of human
              wdt:P570 ?date_of_death;           # date of death
              wdt:P569 ?date_of_birth;           # date of birth
              rdfs:label ?canonical_name.        # person's name

      OPTIONAL { ?person wdt:P509 ?cause_of_death. }  # cause of death
      OPTIONAL { ?person schema:description ?cause_of_death_details. }

      FILTER(?date_of_death >= "${startDate}"^^xsd:date && ?date_of_death <= "${endDate}"^^xsd:date)
      FILTER(LANG(?canonical_name) = "en")
      FILTER(LANG(?cause_of_death_details) = "en")
    }
    ORDER BY DESC(?date_of_death)
    LIMIT 100`;

    const encodedQuery = encodeURIComponent(query);
    const url = `https://query.wikidata.org/sparql?query=${encodedQuery}&format=json`;
    
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DeadpoolGameBot/1.0 (Celebrity Death Tracking)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`HTTP error ${response.status} from Wikidata`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data.results?.bindings?.length || 0} results from Wikidata`);
    
    const deaths: WikidataDeath[] = [];
    
    for (const result of data.results.bindings) {
      const canonical_name = result.canonical_name?.value;
      const date_of_death = result.date_of_death?.value;
      const date_of_birth = result.date_of_birth?.value;
      const cause_of_death_details = result.cause_of_death_details?.value;
      
      if (!canonical_name || !date_of_death || !date_of_birth) {
        console.log(`Skipping incomplete record: ${canonical_name}`);
        continue;
      }
      
      // Calculate age
      let age = undefined;
      try {
        const dob = new Date(date_of_birth);
        const dod = new Date(date_of_death);
        age = dod.getFullYear() - dob.getFullYear();
        if (dod.getMonth() < dob.getMonth() || 
            (dod.getMonth() === dob.getMonth() && dod.getDate() < dob.getDate())) {
          age--;
        }
      } catch (error) {
        console.log(`Could not calculate age for ${canonical_name}`);
        continue;
      }
      
      if (!age || age < 1 || age > 120) {
        console.log(`Invalid age (${age}) for ${canonical_name}, skipping`);
        continue;
      }
      
      deaths.push({
        canonical_name,
        date_of_birth: date_of_birth.split('T')[0],
        date_of_death: date_of_death.split('T')[0],
        cause_of_death_details,
        age
      });
      
      console.log(`Found death: ${canonical_name}, age ${age}`);
    }
    
    console.log(`Extracted ${deaths.length} deaths from Wikidata`);
    return deaths;
    
  } catch (error) {
    console.error('Error querying Wikidata:', error);
    throw error;
  }
}

async function processDeaths(supabase: any, deaths: WikidataDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('deceased_celebrities')
      .select('id')
      .eq('canonical_name', death.canonical_name)
      .eq('date_of_death', death.date_of_death)
      .single();
    
    if (!existing) {
      const dateOfDeath = new Date(death.date_of_death);
      const gameYear = dateOfDeath.getFullYear();
      
      // Insert new death record
      const { data: newDeath, error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.canonical_name,
          date_of_birth: death.date_of_birth,
          date_of_death: death.date_of_death,
          age_at_death: death.age,
          cause_of_death_category: 'Unknown',
          cause_of_death_details: death.cause_of_death_details,
          game_year: gameYear,
          source_url: `https://www.wikidata.org/entity/${death.canonical_name}`,
          died_on_birthday: false,
          died_on_major_holiday: false,
          died_during_public_event: false,
          died_in_extreme_sport: false,
          is_first_death_of_year: false,
          is_last_death_of_year: false,
          is_approved: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting death:', error);
      } else {
        console.log(`Inserted death record for ${death.canonical_name}`);
        deathsAdded++;
      }
    } else {
      console.log(`Death already exists: ${death.canonical_name}`);
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { startDate, endDate } = await req.json();
    
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

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

    console.log(`Starting Wikidata death query for ${startDate} to ${endDate}...`);
    
    // Query Wikidata with the specified date range
    const deaths = await queryWikidataDeaths(startDate, endDate);
    
    console.log(`Found ${deaths.length} deaths from Wikidata`);
    
    // Update log with deaths found
    await supabaseClient
      .from('fetch_logs')
      .update({
        deaths_found: deaths.length
      })
      .eq('id', logEntry.id);
    
    // Process and store deaths
    const { deathsAdded, picksScored } = await processDeaths(supabaseClient, deaths, logEntry.id);
    
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
        deathsAdded,
        picksScored,
        source: 'Wikidata',
        message: `Celebrity deaths queried successfully from Wikidata for ${startDate} to ${endDate}` 
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
