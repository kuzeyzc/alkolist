/// <reference lib="deno.ns" />
import { serve } from "@std/http"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { query, lat, lon, radius = 5000 } = await req.json()
    const apiKey = Deno.env.get('FOURSQUARE_API_KEY')

    console.log('📥 Request:', { query, lat, lon, radius })
    console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')

    // API key kontrolü
    if (!apiKey) {
      console.error('❌ FOURSQUARE_API_KEY bulunamadı!')
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          message: 'Supabase Dashboard -> Settings -> Edge Functions -> Secrets kısmından FOURSQUARE_API_KEY ekleyin'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // YENİ Foursquare Places API (Post-June 2025)
    const params = new URLSearchParams()
    params.append('limit', '20')
    
    // Yeni API için gerekli fields (fsq_place_id artık!)
    params.append('fields', 'fsq_id,name,geocodes,location,categories,distance')
    
    if (lat && lon) {
      params.append('ll', `${lat},${lon}`)
      params.append('radius', radius.toString())
    }
    
    if (query && query.trim()) {
      params.append('query', query.trim())
    } else {
      // GPS modu: Bar, Gece Kulübü, Restoran kategorileri
      params.append('categories', '13003,13038,13065')
    }

    const url = `https://api.foursquare.com/v3/places/search?${params.toString()}`
    console.log('🌐 Foursquare URL:', url)

    // Foursquare API v3 isteği (Bearer prefix GEREKLİ)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': apiKey.startsWith('fsq3') ? apiKey : `Bearer ${apiKey}`,
        'Accept': 'application/json',
      }
    })

    console.log('📡 Foursquare Status:', response.status)

    // Hata durumunu logla
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Foursquare Error:', response.status, errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'Foursquare API error',
          status: response.status,
          message: errorText,
          url: url.replace(apiKey, 'API_KEY_HIDDEN')
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      )
    }

    const data = await response.json()
    console.log('✅ Success:', data.results?.length || 0, 'venues')
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('❌ Exception:', message)
    
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }

})