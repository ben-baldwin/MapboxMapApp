import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import axios from 'axios'
import campSites from '../data/tourismCampSites.geojson';
import BasemapButton from './BasemapButton';
import darkImg from '../assets/dark.png'
import dayNav from '../assets/dayNav.png'
import defaultMapbox from '../assets/defaultMapbox.png'
import nightNav from '../assets/nightNav.png'
import satellite from '../assets/satellite.png'

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
      style: 'mapbox://styles/mapbox/navigation-night-v1',
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

  const handleBasemapChange = (id) => {
    const selectedBasemap = id;
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
    <div className='flex h-full w-full relative flex-1 z-10'>

      {/* Map Layer Accordion */}

      <div className='w-full h-full max-w-lg bg-zinc-700 shadow-xl p-4 z-10'>
        {/* Camp Sites toggle */}
        <div className='p-2'>
          <label className="relative inline-flex items-center mr-5 cursor-pointer">
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 select-none">Camp Sites</span>
            <input type="checkbox" value="" onClick={handleLayerToggle} className="sr-only peer"></input>
          </label>
        </div>
        {/* <div className='flex justify-between' onClick={toggleAccordian}>
          <p className='font-bold select-none'>Turn By Turn Navigation</p>
          <span className='font-bold select-none'>{isOpen ? '-' : '+'}</span>
        </div> */}
        {/* {isOpen && ( */}
        <div className='flex flex-col p-2 gap-2 w-full max-w-lg'>
          <input type='text'
            className='rounded bg-lime-200 p-1 text-lg focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-teal-700 placeholder-neutral-600'
            placeholder='Address, City, POI'
            onChange={handleInputChange}>
          </input>
          {
            geoData.map(item => (
              <button className='text-start text-lg text-lime-200' onClick={(e) => handleGeoCodeSelection(item.geometry.coordinates)} key={item.id}>{item.place_name}</button>
            ))
          }
          <button className='bg-gradient-to-r from-teal-200 to-lime-200 hover:bg-gradient-to-l hover:from-teal-200 hover:to-lime-200 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-teal-700 rounded text-sm px-5 py-2.5 text-center font-semibold text-neutral-600' onClick={getNavigation}>Get Directions</button>
        </div>
        {/* )} */}

        {/* Basemap Selector' */}

        <div className='w-full flex justify-between max-w-md absolute bottom-8 left-8 mb-4'>
          <BasemapButton layerParameter="satellite-streets-v12" buttonText="Satellite" img={satellite} submitFunction={handleBasemapChange}/>
          {/* <BasemapButton layerParameter="light-v11" buttonText="Light" submitFunction={handleBasemapChange} /> */}
          <BasemapButton layerParameter="dark-v11" buttonText="Dark" submitFunction={handleBasemapChange} img={darkImg} />
          <BasemapButton layerParameter="navigation-day-v1" buttonText="Day Nav" img={dayNav} submitFunction={handleBasemapChange} />
          <BasemapButton layerParameter="navigation-night-v1" buttonText="Night Nav" img={nightNav} submitFunction={handleBasemapChange} />
          <BasemapButton layerParameter="streets-v12" buttonText="Default" img={defaultMapbox} submitFunction={handleBasemapChange} />
        </div>
      </div>

      {/* Map Component */}

      <div ref={mapContainer} className="flex-1">
      </div>
    </div>
  )
}

export default Map