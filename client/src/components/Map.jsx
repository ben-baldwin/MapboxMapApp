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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar } from '@fortawesome/free-solid-svg-icons';

// make an env variable
mapboxgl.accessToken = 'pk.eyJ1IjoiYmVuYmFsZHdpbjU1IiwiYSI6ImNsZ2pwbXJhcjBwZWozZnA0dWFkZ3YydGMifQ.27A8k4rZf87cluG99yfaGw';

const MAP_SOURCES = {
  campSites: {
    type: 'geojson',
    data: campSites,
    cluster: true,
    clusterMaxZoom: 14, // max zoom to cluster points on
    clusterRadius: 50 // Radius of each cluster when clustering points (50 is default)
  }
}

const MAP_LAYERS = {
  campSites: {
    id: 'clusters',
    source: 'campSites',
    filter: ['has', 'point_count'],
    type: 'circle',
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#d9f99d',
        100,
        '#B9F8C1',
        750,
        '#99f6e4'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        100,
        30,
        750,
        40
      ]
    }
  },
  clusterCount: {
    id: 'cluster-count',
    type: 'symbol',
    source: 'campSites',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    }
  },
  unclusteredPoint: {
    id: 'unclustered-point',
    type: 'circle',
    source: 'campSites',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 4,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
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
  const [start, setStart] = useState([]);
  const [end, setEnd] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [routeDirections, setRouteDirections] = useState([]);
  const [routeDistance, setRouteDistance] = useState([]);
  const [routeDuration, setRouteDuration] = useState([]);

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
      addLayers(['campSites', 'clusterCount', 'unclusteredPoint']);
      addEventListeners();
    })
    setLoaded(true)
  }, []);

  const addEventListeners = (e) => {
    // map.current.on('click', 'campSites', (e) => {
    // copy coordinates array
    // const properties = e.features[0].properties;
    // console.log(properties);
    // const coordinates = e.features[0].geometry.coordinates.slice();
    // setEnd(coordinates);
    //   let description = '';

    //   if ('name' in properties) {
    //     description = properties.name;
    //   }

    //   new mapboxgl.Popup()
    //     .setLngLat(coordinates)
    //     .setHTML(description)
    //     .addTo(map.current)
    // });
    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    map.current.on('click', 'unclustered-point', (e) => {
      const properties = e.features[0].properties;
      // console.log(properties);
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

    // inspect a cluster on click
    map.current.on('click', 'clusters', (e) => {
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      map.current.getSource('campSites').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
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

  const handleAccordion = () => {
    setIsOpen(!isOpen)
  }

  const getGeoCoder = (searchTerm) => {
    axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${searchTerm}.json?access_token=${mapboxgl.accessToken}`)
      .then(response => {
        const { features } = response.data
        setGeoData(features);
        // console.log(geoData);
      })
      .catch(error => {
        console.log(error);
      });
  }
  const getNavigation = () => {
    axios.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`)
      .then(response => {
        // console.log(response.data);
        setRouteDirections(response.data.routes[0].legs[0].steps)
        setRouteDistance(response.data.routes[0].distance)
        setRouteDuration(response.data.routes[0].duration)
        console.log(response.data.routes[0].duration);
        // console.log(routeDirections);
        // console.log(response.data.routes[0].legs[0]);
        const data = response.data.routes[0]
        const route = response.data.routes[0].geometry.coordinates;
        // const geojson = {
        //   type: 'feature',
        //   properties: {},
        //   geometry: {
        //     type: 'lineString',
        //     coordinates: route
        //   }
        // };
        // // if the route already exists on the map, we'll reset it using setData
        // if (map.current.getSource('route')) {
        //   map.getSource('route').setData(geojson);
        // }
        // // otherwise, we'll make a new request
        // else {
        //   map.current.addLayer({
        //     id: 'route',
        //     type: 'line',
        //     source: {
        //       type: 'geojson',
        //       data: geojson
        //     },
        //     layout: {
        //       'line-join': 'round',
        //       'line-cap': 'round'
        //     },
        //     paint: {
        //       'line-color': '#3887be',
        //       'line-width': 5,
        //       'line-opacity': 0.75
        //     }
        //   });
        // }
      })
      .catch(error => {
        console.log(error);
      });
  }



  return (
    <div className='flex h-full w-full relative flex-1 z-10'>

      {/* Map Layer Accordion */}

      <div className='w-full h-full max-w-lg bg-zinc-700 shadow-xl p-4 z-10'>
        <div className='bg-zinc-600 rounded-md shadow-md m-2 text-lime-200 text-lg'>
          <div className='flex justify-between items-center px-2' onClick={handleAccordion}>
            <p className='m-2'>Instructions</p>
            <p>{isOpen ? '-' : '+'}</p>
          </div>
          {isOpen && (
            <div className='m-2'>
              <p>First, using the address bar below, type in your current location. It can be as specific as your address or as broad as your city. Once you have selected the correct starting destination, explore the map and utilize the many basemap layers provided to find a campsite that you would like to visit. Once you have found a campsite, click on the campsite node. Now that you have your starting point and destination, select the "Get Directions" button to view turn by turn directions to the campsite! </p>
            </div>
          )}
        </div>
        {/* Camp Sites toggle */}
        <div className='p-2'>
          <label className="relative inline-flex items-center mr-5 cursor-pointer">
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600">
            </div>
            <span className="ml-3 text-lg text-lime-200 select-none">Camp Sites</span>
            <input type="checkbox" value="" onClick={handleLayerToggle} className="sr-only peer"></input>
          </label>
        </div>
        <div className='flex flex-col p-2 gap-2 w-full max-w-lg'>
          <input type='text'
            className='rounded bg-lime-200 p-1 text-lg focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-teal-700 placeholder-neutral-600'
            placeholder='Address, City, POI'
            onChange={handleInputChange}>
          </input>
          <div className='bg-zinc-600 shadow-md rounded-md'>
            {
              geoData.map(item => (
                <button className='text-start w-full text-lg text-lime-200 p-2 hover:bg-zinc-700' onClick={(e) => handleGeoCodeSelection(item.geometry.coordinates)} key={item.id}>{item.place_name}</button>
              ))
            }
          </div>
          <button className='bg-gradient-to-r from-teal-200 to-lime-200 hover:bg-gradient-to-l hover:from-teal-200 hover:to-lime-200 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-teal-700 rounded text-sm px-5 py-2.5 text-center font-semibold text-neutral-600'
            onClick={getNavigation}>Get Directions
          </button>
          <div className='w-full max-h-16 bg-zinc-600 shadow-md rounded-md p-2'>
            <div className='flex space-x-20 text-teal-200 text-lg'>
              <FontAwesomeIcon icon={faCar} style={{ color: "#99f6e4", fontSize: '1.5em' }} />
              <p>Time: {(routeDuration / 3600).toFixed(2)} hrs</p>
              <p>Distance: {(routeDistance * 0.00062137).toFixed(2)} mi</p>
            </div>
          </div>
          <div className='bg-zinc-600 max-h-96 overflow-y-scroll scrollbar-none shadow-md rounded-md'>
            {
              routeDirections.map((directionsObject, index) => (
                <div className='w-full flex justify-between hover:bg-zinc-700 p-2 px-4'>
                  <p className='text-lg text-lime-200' key={index}>{directionsObject.maneuver.instruction}</p>
                  {
                    ((directionsObject.distance * 3.28084).toFixed(2) === '0.00') ? null :
                      ((directionsObject.distance * 0.00062137).toFixed(2) > .75) ?
                        // distance in miles
                        <p className='text-lg text-lime-200 min-w-max'>{(directionsObject.distance * 0.00062137).toFixed(2)} mi</p> :
                        // distance in feet
                        <p className='text-lg text-lime-200 min-w-max'>{(directionsObject.distance * 3.28084).toFixed(0)} ft</p>
                  }
                </div>
              ))
            }
          </div>
        </div>
        {/* )} */}

        {/* Basemap Selector' */}

        <div className='w-full flex justify-between max-w-md absolute bottom-8 left-8 mb-4'>
          <BasemapButton layerParameter="satellite-streets-v12" buttonText="Satellite" img={satellite} submitFunction={handleBasemapChange} />
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