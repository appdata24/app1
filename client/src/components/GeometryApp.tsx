import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Scene3D from "./Scene3D";
import GeometryControls from "./GeometryControls";
import { useGeometry } from "../lib/stores/useGeometry";
import { Card, CardContent } from "./ui/card";

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

export default function GeometryApp() {
  const { geometry, isLoading, error } = useGeometry();
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const supported = checkWebGLSupport();
    setWebglSupported(supported);
    if (!supported) {
      console.warn("WebGL is not supported in this environment");
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Controls */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Được tạo và quản lý bởi Admin LimVA
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <GeometryControls />
        </div>

        {error && (
          <div className="p-4 border-t border-gray-200">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Right Panel - 3D View */}
      <div className="flex-1 relative bg-slate-50">
        {webglSupported === null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang kiểm tra hỗ trợ 3D...</p>
            </div>
          </div>
        )}

        {webglSupported === false && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md p-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">
                WebGL không khả dụng
              </h2>
              <p className="text-gray-600 mb-4">
                Môi trường xem trước của Replit không hỗ trợ WebGL, 
                cần thiết để hiển thị hình 3D.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  💡 Giải pháp:
                </p>
                <p className="text-sm text-blue-700">
                  Nhấn nút <strong>"Open in new tab"</strong> ở góc trên bên phải 
                  để mở ứng dụng trong tab trình duyệt riêng. Ứng dụng sẽ hoạt động 
                  đầy đủ ở đó!
                </p>
              </div>
              <p className="text-xs text-gray-500">
                WebGL là công nghệ đồ họa 3D cần GPU acceleration, 
                thường bị vô hiệu hóa trong môi trường preview nhúng.
              </p>
            </div>
          </div>
        )}

        {webglSupported === true && (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tạo hình 3D...</p>
                </div>
              </div>
            )}
            
            <Canvas
              camera={{
                position: [5, 5, 5],
                fov: 45,
                near: 0.1,
                far: 1000
              }}
              gl={{
                antialias: true,
                powerPreference: "high-performance",
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: false,
                alpha: true
              }}
              onCreated={({ gl }) => {
                console.log("WebGL Renderer created successfully:", gl);
              }}
            >
              <color attach="background" args={["#f8fafc"]} />
              
              {/* Lighting */}
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <pointLight position={[-10, -10, -5]} intensity={0.3} />

              <Suspense fallback={null}>
                <Scene3D />
              </Suspense>
            </Canvas>

            {!geometry && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎲</div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Chào mừng đến với Mô phỏng Hình học!
                  </h2>
                  <p className="text-gray-500">
                    Nhập tên hình không gian bên trái để bắt đầu
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
