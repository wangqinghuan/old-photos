"use client";

import PhotoCard from "./PhotoCard";

interface Props {
  photos: any[];
}

export default function PhotoList({ photos }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {photos.map((photo) => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}