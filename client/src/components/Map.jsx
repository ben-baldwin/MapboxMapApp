import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
// mapboxgl.accessToken = 'pk.eyJ1IjoiYmVuYmFsZHdpbjU1IiwiYSI6ImNsZ2pwbXJhcjBwZWozZnA0dWFkZ3YydGMifQ.27A8k4rZf87cluG99yfaGw';

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
      'circle-radius': 6,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  },
  point: {
    id: 'point',
    type: 'circle',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              // coordinates: start
            }
          }
        ]
      }
    },
    paint: {
      'circle-radius': 10,
      'circle-color': '#3887be'
    }
  }
}

const Map = () => {
  const mapContainer = useRef();
  const map = useRef();
  const [campLayer, setCampLayer] = useState(true);
  const [basemap, setBasemap] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [start, setStart] = useState([]);
  const [end, setEnd] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [routeDirections, setRouteDirections] = useState([]);
  const [routeDistance, setRouteDistance] = useState([]);
  const [routeDuration, setRouteDuration] = useState([]);
  const [value, setValue] = useState('')

  // Initialize the map when the component mounts
  useEffect(() => {
// change route name to apiKey
    axios.get('http://localhost:8000/data')
      .then(response => {
        const apiKey = response.data.apiKey;
        console.log(response);
        mapboxgl.accessToken = apiKey
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/navigation-night-v1',
          center: [-95.7129, 37.0902],
          zoom: 4
        });
        
        // Render GeoJSON data as a map layer
        map.current.on('style.load', () => {
          addSources(['campSites']);
          addLayers(['campSites', 'clusterCount', 'unclusteredPoint', 'point']);
          addEventListeners();
        })
        setLoaded(true)
      })
  }, []);

  const addEventListeners = (e) => {
    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at the location of the feature, with
    // description HTML from its properties.
    map.current.on('click', 'unclustered-point', (e) => {
      const properties = e.features[0].properties;
      // console.log(properties);
      const coordinates = e.features[0].geometry.coordinates.slice();
      setEnd(coordinates);
      // build popup content
      let popupContent = '';
      if ('name' in properties) {
        popupContent += `<p><strong>Name:</strong> ${properties.name}</p>`;
      }
      else (popupContent += `<p><strong>Name:</strong> No Name Available</p>`);

      if ('operator' in properties) {
        popupContent += `<p><strong>Operator:</strong> ${properties.operator}</p>`
      }

      if ('phone' in properties) {
        popupContent += `<p><strong>Phone:</strong> ${properties.phone}</p>`
      }

      if ('tents' in properties) {
        popupContent += `<p><strong>Tents:</strong> ${properties.tents}</p>`
      }

      if ('caravans' in properties) {
        popupContent += `<p><strong>Caravans:</strong> ${properties.caravans}</p>`
      }

      if ('drinking_water' in properties) {
        popupContent += `<p><strong>Drinking Water:</strong> ${properties.drinking_water}</p>`
      }

      if ('backcountry' in properties) {
        popupContent += `<p><strong>Backcountry:</strong> ${properties.backcountry}</p>`
      }

      if ('fee' in properties) {
        popupContent += `<p><strong>Fee:</strong> ${properties.fee}</p>`
      }

      if ('toilets' in properties) {
        popupContent += `<p><strong>Toilets:</strong> ${properties.toilets}</p>`
      }

      if ('shower' in properties) {
        popupContent += `<p><strong>Shower:</strong> ${properties.shower}</p>`
      }
      // instantiate a mapbox popup
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map.current)
    });
    // handle hover event for clustered points
    map.current.on('mouseenter', 'clusters', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'clusters', () => {
      map.current.getCanvas().style.cursor = '';
    });
    // handle hover event for unclustered points
    map.current.on('mouseenter', 'unclustered-point', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'unclustered-point', () => {
      map.current.getCanvas().style.cursor = '';
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

  // iterate through all sources and add to map
  const addSources = (sourcesIDs) => {
    sourcesIDs.forEach(sourceID => {
      map.current.addSource(sourceID, MAP_SOURCES[sourceID])
    })
  }

  // iterate through all layers and add to map
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

  // changes basemap
  const handleBasemapChange = (id) => {
    const selectedBasemap = id;
    setBasemap(selectedBasemap);
    // Update the map style based on the selected basemap
    if (map.current) {
      const mapStyle = `mapbox://styles/mapbox/${selectedBasemap}`;
      map.current.setStyle(mapStyle);
    }
  }

  const handleInputChange = (event, item) => {
    const searchTerm = event.target.value;
    setValue(searchTerm) //update the value state with the users input
    // console.log(searchTerm);
    getGeoCoder(searchTerm);
  }

  // when geoCode button is selected, set those coordinates using setStart
  const handleGeoCodeSelection = (coordinates, item) => {
    setStart(coordinates)
    setValue(item.place_name)
    setGeoData([])
  }

  // reset the map handler
  const handleReset = () => {
    setStart([]);
    setEnd([]);
    setGeoData([]);
    setRouteDirections([]);
    setRouteDistance([]);
    setValue('')
  }

  // api call to geocoder
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
        setRouteDirections(response.data.routes[0].legs[0].steps)
        setRouteDistance(response.data.routes[0].distance)
        setRouteDuration(response.data.routes[0].duration)
        const route = response.data.routes[0].geometry.coordinates;
        // console.log(route);
        const bounds = route.reduce(
          (bbox, coord) => {
            return [
              [Math.min(bbox[0][0], coord[0]), Math.min(bbox[0][1], coord[1])],
              [Math.max(bbox[1][0], coord[0]), Math.max(bbox[1][1], coord[1])]
            ];
          },
          [[Infinity, Infinity], [-Infinity, -Infinity]]
        );
        // console.log(bounds);

        // calculate center of the bounds
        const borderBounds = [
          (bounds[0][0] + bounds[1][0]) / 2, //longitude
          (bounds[0][1] + bounds[1][1]) / 2  //latitude
        ];

        map.current.flyTo({
          center: borderBounds,
          essential: true //ensures smooth transition
        });

        // Once a route is rendered, hide clusters, campsite nodes, and cluster count
        let hideCampNodes = 'unclustered-point'
        let hideClusters = 'clusters'
        let hideClusterCount = 'cluster-count'
        map.current.setLayoutProperty(hideCampNodes, 'visibility', 'none');
        map.current.setLayoutProperty(hideClusters, 'visibility', 'none');
        map.current.setLayoutProperty(hideClusterCount, 'visibility', 'none');

        // create nodes for start and end on route.
        let startMarker = new mapboxgl.Marker({ color: 'green' })
          .setLngLat(start)
          .addTo(map.current);

        let endMarker = new mapboxgl.Marker({ color: 'blue' })
          .setLngLat(end)
          .addTo(map.current);

        const geojson = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route
          },
          properties: {},
        };
        // // if the route already exists on the map, we'll reset it using setData
        if (map.current.getSource('route')) {
          map.current.getSource('route').setData(geojson);
        }
        // otherwise, we'll make a new request
        else {
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: {
              type: 'geojson',
              data: geojson
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3887be',
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }

  return (
    <main className='flex flex-col-reverse lg:flex-row flex-1'>
      {/* <Draggable handle=".handle"> */}
      <nav className='bg-zinc-500 w-full flex flex-col lg:h-full lg:w-[450px] space-y-2 p-1 md:p-2'>
        {/* Address Input */}
        <div className='flex justify-between items-center'>
          <input type='text'
            className='w-full bg-zinc-100 p-1 text-lg focus:ring-4 focus:outline-none placeholder-neutral-600 rounded-sm shadow-lg'
            placeholder='Address, City, POI'
            onChange={handleInputChange}
            value={value}>
          </input>
        </div>
        {/* // search results */}
        <div className='flex flex-col flex-1'>
          <div className='bg-zinc-600 shadow-lg rounded'>
            {
              geoData.slice(0, 3).map(item => (
                <button className='text-start w-full text-lg text-lime-200 p-2 hover:bg-zinc-700' onClick={(e) => handleGeoCodeSelection(item.geometry.coordinates, item)} key={item.id}>{item.place_name}</button>
              ))
            }
          </div>
          {/* Get Directions Button */}
          <button className='bg-gradient-to-r w-full mb-2 from-teal-200 to-lime-200 hover:bg-gradient-to-l hover:from-teal-200 hover:to-lime-200 focus:ring-4 rounded text-sm px-5 py-2.5 text-center font-semibold text-neutral-600 shadow-lg md:mt-2'
            onClick={getNavigation}>
            Get Directions
          </button>
          {/* Turn by Turn Directions */}
          <div className='bg-zinc-600 max-h-96 lg:max-h-[950px] overflow-y-scroll scrollbar-none shadow-lg rounded-md mb-2'>
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
            {routeDirections.length > 0 &&
              /* Trip Time and Distance Info */
              < div className='flex justify-between text-teal-200 text-sm w-full max-h-16 bg-zinc-600 shadow-lg rounded p-2'>
                <FontAwesomeIcon icon={faCar} style={{ color: "#99f6e4", fontSize: '1.5em' }} />
                <p>Time: {(routeDuration / 3600).toFixed(2)} hrs</p>
                <p>Distance: {(routeDistance * 0.00062137).toFixed(2)} mi</p>
              </div>
            }
          </div>
          <div className='mt-auto'>
            {/* <button className='bg-zinc-300 w-full mb-2 rounded text-sm px-5 py-2.5 text-center font-semibold text-neutral-600 shadow-lg'
              onClick={handleReset}>
              Reset
            </button> */}
            <div className='justify-between flex gap-2'>
              <BasemapButton layerParameter="satellite-streets-v12" buttonText="Satellite" img={satellite} submitFunction={handleBasemapChange} />
              <BasemapButton layerParameter="dark-v11" buttonText="Dark" img={darkImg} submitFunction={handleBasemapChange} />
              <BasemapButton layerParameter="navigation-day-v1" buttonText="Nav" img={dayNav} submitFunction={handleBasemapChange} />
              <BasemapButton layerParameter="navigation-night-v1" buttonText="Dark Nav" img={nightNav} submitFunction={handleBasemapChange} />
              <BasemapButton layerParameter="streets-v12" buttonText="Default" img={defaultMapbox} submitFunction={handleBasemapChange} />
            </div>
          </div>
        </div>
      </nav>
      {/* Map */}
      <div className='bg-blue-500 flex-1 h-full' ref={mapContainer}></div>
    </main >
  )
}

export default Map