import React, { useState, useEffect, useRef } from 'react';
import { fileToBase64 } from '../utils';
import { savePhoto, getPhoto, deletePhoto } from '../db';
import { v4 as uuidv4 } from 'uuid';

interface PhotoUploadProps {
  label: string;
  photoId: string | null;
  onChange: (id: string | null) => void;
  id: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ label, photoId, onChange, id }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (photoId) {
      getPhoto(photoId).then(setPreview);
    } else {
      setPreview(null);
    }
  }, [photoId]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(s);
      setIsCameraOpen(true);
      // Wait for ref to be available
      setTimeout(() => {
          if (videoRef.current) {
              videoRef.current.srcObject = s;
          }
      }, 100);
    } catch (err) {
      console.error(err);
      alert("Камера недоступна. Используй кнопку загрузки файла.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        // Flip horizontally if using front camera (optional, usually environment is back)
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Add aggressive watermark
        ctx.font = 'bold 30px monospace';
        ctx.fillStyle = 'red';
        ctx.fillText(new Date().toLocaleTimeString(), 20, 40);
        ctx.fillText("КЛЕЙМО", 20, 80);

        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        const newId = uuidv4();
        await savePhoto(newId, base64);
        
        if (photoId) await deletePhoto(photoId);
        
        stopCamera();
        onChange(newId);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        const newId = uuidv4();
        await savePhoto(newId, base64);
        
        if (photoId) await deletePhoto(photoId);

        onChange(newId);
      } catch (err) {
        alert("Ошибка загрузки, криворукая мразь.");
      }
    }
  };

  const handleClear = async () => {
      if (photoId) {
          await deletePhoto(photoId);
          onChange(null);
      }
  }

  return (
    <div className="mb-4">
      <label className="block text-zinc-400 text-xs uppercase tracking-widest mb-1">{label}</label>
      
      {!isCameraOpen && (
        <div className="flex flex-col gap-2">
            {!photoId ? (
                <div className="flex gap-2">
                    <button 
                        onClick={startCamera}
                        className="flex-1 border-2 border-red-600 bg-black text-red-600 py-3 uppercase font-creep text-lg hover:bg-red-950 animate-pulse"
                    >
                        СНЯТЬ ФОТО
                    </button>
                    
                    <input 
                    type="file" 
                    id={id}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                    />
                    <label 
                    htmlFor={id}
                    className="cursor-pointer border border-zinc-700 bg-black text-zinc-500 px-4 flex items-center justify-center hover:text-zinc-300"
                    >
                    📁
                    </label>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <div className="flex-1 border border-green-800 bg-green-950 text-green-400 py-3 text-center text-xs uppercase font-bold tracking-wider">
                        ФОТО ПРИНЯТО
                    </div>
                    <button 
                        onClick={handleClear}
                        className="px-4 py-3 border border-red-900 text-red-600 hover:bg-red-950"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
      )}

      {isCameraOpen && (
          <div className="relative border-4 border-red-900 bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-64 object-cover filter contrast-125 grayscale-[0.3]"
              />
              <div className="absolute inset-0 border-2 border-red-600/30 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border border-red-500/50 rounded-full"></div>
                  <div className="absolute bottom-2 right-2 text-red-600 text-[10px] font-mono animate-pulse">REC ●</div>
              </div>
              
              <div className="flex">
                  <button 
                    onClick={stopCamera}
                    className="flex-1 py-3 bg-zinc-900 text-zinc-400 border-t border-r border-zinc-700 uppercase text-xs"
                  >
                    ОТМЕНА
                  </button>
                  <button 
                    onClick={capturePhoto}
                    className="flex-[2] py-3 bg-red-800 text-white font-bold uppercase tracking-widest hover:bg-red-700"
                  >
                    СДЕЛАТЬ КАДР
                  </button>
              </div>
          </div>
      )}

      {preview && !isCameraOpen && (
          <div className="mt-2 w-full h-32 overflow-hidden border border-zinc-800 relative">
              <img src={preview} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                  <span className="text-4xl text-red-600 font-creep rotate-12 border-2 border-red-600 p-2">КЛЕЙМО</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default PhotoUpload;