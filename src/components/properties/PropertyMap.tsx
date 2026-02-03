"use client";

import { useEffect, useRef, useState } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { Property } from "@/types/property";
import { useRouter } from "next/navigation";

interface PropertyMapProps {
    properties: Property[];
}

const MapComponent = ({ properties }: { properties: Property[] }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map>();
    const router = useRouter();

    useEffect(() => {
        if (ref.current && !map) {
            setMap(new google.maps.Map(ref.current, {
                center: { lat: 35.6586, lng: 139.7454 }, // Tokyo Tower area default
                zoom: 13,
                disableDefaultUI: false,
                clickableIcons: false,
            }));
        }
    }, [ref, map]);


    // Update markers when properties change
    useEffect(() => {
        if (!map) return;

        const markers: google.maps.Marker[] = [];

        properties.forEach((property) => {
            if (property.location) {
                const marker = new google.maps.Marker({
                    position: property.location,
                    map: map,
                    title: property.name,
                });

                // Create DOM element for InfoWindow content to enable SPA navigation
                const contentDiv = document.createElement("div");
                contentDiv.style.cursor = "pointer";
                contentDiv.style.padding = "8px";
                contentDiv.style.width = "200px";
                contentDiv.innerHTML = `
                    <img src="${property.images?.[0] || ''}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />
                    <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${property.name}</h3>
                    <p style="color: #666; font-size: 12px; margin-bottom: 4px;">${property.address}</p>
                    <p style="color: #0066cc; font-weight: bold; font-size: 14px;">${(property.price / 10000).toLocaleString()}万円</p>
                `;

                // Add click listener to navigate
                contentDiv.addEventListener("click", () => {
                    router.push(`/properties/${property.id}`);
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: contentDiv,
                });

                marker.addListener("click", () => {
                    infoWindow.open(map, marker);
                });

                markers.push(marker);
            }
        });

        return () => {
            markers.forEach(m => m.setMap(null));
        };
    }, [map, properties, router]);

    return <div ref={ref} style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 200px)" }} />;
};

export function PropertyMap({ properties }: PropertyMapProps) {
    const render = (status: Status) => {
        if (status === Status.FAILURE) return <div className="p-8 text-center text-red-500">基本地図の読み込みに失敗しました (API Key missing)</div>;
        return <div className="p-8 text-center">地図を読み込み中...</div>;
    };

    return (
        <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} render={render}>
            <MapComponent properties={properties} />
        </Wrapper>
    );
}
