import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import axios from 'axios'
import campSites from '../data/tourismCampSites.geojson';
import BasemapButton from './BasemapButton';

// make an env variable
mapboxgl.accessToken = 'pk.eyJ1IjoiYmVuYmFsZHdpbjU1IiwiYSI6ImNsZ2pwbXJhcjBwZWozZnA0dWFkZ3YydGMifQ.27A8k4rZf87cluG99yfaGw';

const MAP_SOURCES = {
  campSites: {
    type: 'geojson',
    data: campSites
  }
}

const MAP_LAYERS = {
  campSites: {
    id: 'campSites',
    source: 'campSites',
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': 'blue'
    }
  }

}

const Map = () => {
  const mapContainer = useRef();
  const map = useRef();
  const popupRef = useRef();
  const [campLayer, setCampLayer] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [basemap, setBasemap] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [start, setStart] = useState([])
  const [end, setEnd] = useState([])
  const [geoData, setGeoData] = useState([])

  // Initialize the map when the component mounts
  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-95.7129, 37.0902],
      zoom: 4
    });

    // Render GeoJSON data as a map layer
    map.current.on('style.load', () => {
      addSources(['campSites']);
      addLayers(['campSites']);
      addEventListeners();
    })
    setLoaded(true)
  }, []);

  const addEventListeners = (e) => {
    map.current.on('click', 'campSites', (e) => {
      // copy coordinates array
      const properties = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();
      setEnd(coordinates);
      let description = '';

      if ('name' in properties) {
        description = properties.name;
      }

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map.current)
    });
  }

  const addSources = (sourcesIDs) => {
    sourcesIDs.forEach(sourceID => {
      map.current.addSource(sourceID, MAP_SOURCES[sourceID])
    })
  }

  const addLayers = (layersIDs) => {
    layersIDs.forEach(layerID => {
      map.current.addLayer(MAP_LAYERS[layerID])
    })
  }

  // Toggle the visibility of the map layer based on the state
  useEffect(() => {
    if (map.current) {
      const mapLayer = map.current.getLayer('campSites')
      if (mapLayer) {
        map.current.setLayoutProperty('campSites', 'visibility', campLayer ? 'visible' : 'none')
      }
    }
  }, [campLayer]);

  const handleLayerToggle = (e) => {
    e.preventDefault();
    setCampLayer(!campLayer);
  }

  const handleBasemapChange = (e) => {
    const selectedBasemap = e.target.value;
    setBasemap(selectedBasemap);
    // Update the map style based on the selected basemap
    if (map.current) {
      const mapStyle = `mapbox://styles/mapbox/${selectedBasemap}`;
      map.current.setStyle(mapStyle);
    }
  }

  const handleInputChange = (event) => {
    const searchTerm = event.target.value;
    getGeoCoder(searchTerm);
  }

  const toggleAccordian = () => {
    setIsOpen(!isOpen)
  }

  const handleGeoCodeSelection = (coordinates) => {
    setStart(coordinates)
  }

  const getGeoCoder = (searchTerm) => {
    axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${searchTerm}.json?access_token=${mapboxgl.accessToken}`)
      .then(response => {
        const { features } = response.data
        setGeoData(features);
      })
      .catch(error => {
        console.log(error);
      });
  }
  const getNavigation = () => {
    axios.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`)
      .then(response => {
        console.log(response);
      })
      .catch(error => {
        console.log(error);
      });
  }



  return (
    <div className='flex flex-col h-full w-full relative flex-1 z-10'>

      {/* Map Layer Accordion */}

      <div className='w-full max-w-lg absolute top-8 left-8 bg-slate-400 shadow-xl p-2 rounded-md z-10'>
        <div>
          <label className="relative inline-flex items-center mr-5 cursor-pointer">
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 select-none">Camp sites</span>
            <input type="checkbox" value="" onClick={handleLayerToggle} className="sr-only peer"></input>
          </label>
        </div>
        <div className='flex justify-between' onClick={toggleAccordian}>
          <p className='font-bold select-none'>Turn By Turn Navigation</p>
          <span className='font-bold select-none'>{isOpen ? '-' : '+'}</span>
        </div>
        {isOpen && (
          <div className='flex flex-col p-2 w-full max-w-lg'>
            <input type='text' onChange={handleInputChange}></input>
            {
              geoData.map(item => (
                <button onClick={(e) => handleGeoCodeSelection(item.geometry.coordinates)} className='text-start' key={item.id}>{item.place_name}</button>
              ))
            }
            <button onClick={getNavigation}>Get Directions</button>
          </div>
        )}
      </div>

      {/* Basemap Selector' */}

      <div className='w-full max-w-lg absolute bottom-8 left-8 space-x-2 z-10'>
        <BasemapButton layerParameter="satellite-streets-v12" buttonText="Satellite" submitFunction={handleBasemapChange} />
        <BasemapButton layerParameter="light-v11" buttonText="Light" submitFunction={handleBasemapChange} />
        <BasemapButton layerParameter="dark-v11" buttonText="Dark" submitFunction={handleBasemapChange} />
        <BasemapButton layerParameter="navigation-day-v1" buttonText="Day Nav" submitFunction={handleBasemapChange} />
        <BasemapButton layerParameter="navigation-night-v1" buttonText="Night Nav" submitFunction={handleBasemapChange} />
        <BasemapButton layerParameter="streets-v12" buttonText="Mapbox Streets" submitFunction={handleBasemapChange} />
      </div>

      {/* Map Component */}

      <div ref={mapContainer} className="App flex-1">
      </div>
    </div>
  )
}

export default Map