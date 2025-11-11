
"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export function Earth() {
  // A ref to hold the mesh, so we can rotate it in useFrame
  const meshRef = useRef<THREE.Mesh>(null!);

  // Load the texture map for the Earth
  // This is a free, high-res texture from Wikimedia Commons.
  // FIX: The URL is now a clean string, not a Markdown link.
  const [map] = useTexture([
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Equirectangular_projection_SW.jpg/1920px-Equirectangular_projection_SW.jpg",
  ]);

  // This hook runs on every frame
  useFrame((state, delta) => {
    // Gently rotate the Earth on its Y-axis
    meshRef.current.rotation.y += delta * 0.05;
  });

  return (
    <mesh ref={meshRef}>
      {/* This is the 3D shape of our globe.
        Args are: [radius, widthSegments, heightSegments]
        More segments make the sphere smoother.
      */}
      <sphereGeometry args={[3, 64, 64]} />
      
      {/* This is the "skin" of the globe.
        We're using a standard material, which interacts with light.
        The 'map' property applies our loaded texture.
      */}
      <meshStandardMaterial map={map} />
    </mesh>
  );
}