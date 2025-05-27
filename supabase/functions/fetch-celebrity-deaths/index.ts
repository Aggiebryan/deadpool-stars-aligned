
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

async function fetchRSSDeaths(): Promise<CelebrityDeath[]> {
  try {
    const response = await fetch('https://www.onthisday.com/rss/famous-deaths.xml');
    const xmlText = await response.text();
    
    // Parse RSS XML - simplified parsing for demonstration
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    const deaths: CelebrityDeath[] = [];
    
    for (const item of items.slice(0, 10)) { // Limit to recent items
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      
      if (titleMatch && linkMatch && pubDateMatch) {
        const title = titleMatch[1];
        const nameMatch = title.match(/^(.*?),/);
        const ageMatch = title.match(/age (\d+)/i);
        
        if (nameMatch) {
          deaths.push({
            name: nameMatch[1].trim(),
            dateOfDeath: new Date(pubDateMatch[1]).toISOString().split('T')[0],
            age: ageMatch ? parseInt(ageMatch[1]) : undefined,
            sourceUrl: linkMatch[1]
          });
        }
      }
    }
    
    return deaths;
  } catch (error) {
    console.error('Error fetching RSS deaths:', error);
    return [];
  }
}

async function processDeaths(supabase: any, deaths: CelebrityDeath[]) {
  for (const death of deaths) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('deceased_celebrities')
      .select('id')
      .eq('canonical_name', death.name)
      .eq('date_of_death', death.dateOfDeath)
      .single();
    
    if (!existing && death.age) {
      // Calculate additional fields
      const dateOfDeath = new Date(death.dateOfDeath);
      const gameYear = dateOfDeath.getFullYear();
      
      // Insert new death record
      const { error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.name,
          date_of_death: death.dateOfDeath,
          age_at_death: death.age,
          cause_of_death_category: 'Unknown',
          cause_of_death_details: death.cause || null,
          game_year: gameYear,
          source_url: death.sourceUrl,
          died_on_birthday: false, // Would need birth date to calculate
          died_on_major_holiday: await checkIfHoliday(supabase, death.dateOfDeath, gameYear)
        });
      
      if (error) {
        console.error('Error inserting death:', error);
      } else {
        console.log(`Inserted death record for ${death.name}`);
        
        // Update any matching picks
        await updateMatchingPicks(supabase, death.name, gameYear);
      }
    }
  }
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

async function updateMatchingPicks(supabase: any, celebrityName: string, gameYear: number) {
  // Find matching picks (case-insensitive)
  const { data: picks } = await supabase
    .from('celebrity_picks')
    .select('*')
    .ilike('celebrity_name', celebrityName)
    .eq('game_year', gameYear)
    .eq('is_hit', false);
  
  if (picks && picks.length > 0) {
    // Get the deceased celebrity record for scoring
    const { data: deceased } = await supabase
      .from('deceased_celebrities')
      .select('*')
      .eq('canonical_name', celebrityName)
      .eq('game_year', gameYear)
      .single();
    
    if (deceased) {
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
        const { data: user } = await supabase
          .from('users')
          .select('total_score')
          .eq('id', pick.user_id)
          .single();
        
        if (user) {
          await supabase
            .from('users')
            .update({
              total_score: user.total_score + points
            })
            .eq('id', pick.user_id);
        }
      }
    }
  }
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

    console.log('Fetching celebrity deaths from external sources...');
    
    // Fetch from RSS feed
    const rssDeaths = await fetchRSSDeaths();
    console.log(`Found ${rssDeaths.length} deaths from RSS`);
    
    // Process and store deaths
    await processDeaths(supabaseClient, rssDeaths);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: rssDeaths.length,
        message: 'Celebrity deaths updated successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in fetch-celebrity-deaths function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
