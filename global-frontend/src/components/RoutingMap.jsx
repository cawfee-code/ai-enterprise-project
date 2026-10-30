import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon paths in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RoutingMap = ({ logistics }) => {
    if (!logistics || !logistics.origin) return null;

    // GeoJSON uses [longitude, latitude], but Leaflet requires [latitude, longitude]
    const originCoords = [logistics.origin.coordinates[1], logistics.origin.coordinates[0]];
    
    // If it is a direct dropship (string address), we use a mock customer coordinate for the visualizer
    const isDropship = logistics.routeType === 'direct_dropship';
    const destCoords = isDropship 
        ? [34.0522, -118.2437] // Mock Customer in LA
        : [logistics.destination.coordinates[1], logistics.destination.coordinates[0]]; // QC Hub

    const destLabel = isDropship ? logistics.destination : logistics.destination.address;

    return (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50 shadow-inner">
            <h3 className="text-lg font-bold text-gray-800 mb-2 uppercase tracking-wide">
                Active Supply Chain Route: {logistics.routeType.replace('_', ' ')}
            </h3>
            <div style={{ height: '400px', width: '100%', zIndex: 0 }}>
                <MapContainer 
                    bounds={[originCoords, destCoords]} 
                    zoom={4} 
                    scrollWheelZoom={false} 
                    style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    <Marker position={originCoords}>
                        <Popup><b>Origin:</b><br />{logistics.origin.address}</Popup>
                    </Marker>
                    
                    <Marker position={destCoords}>
                        <Popup><b>Destination:</b><br />{destLabel}</Popup>
                    </Marker>

                    <Polyline 
                        positions={[originCoords, destCoords]} 
                        color={isDropship ? "#10b981" : "#3b82f6"} 
                        weight={4} 
                        dashArray="10, 10" 
                    />
                </MapContainer>
            </div>
        </div>
    );
};

export default RoutingMap;