import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateGeometry, calculateDistance } from "./services/openrouter";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate 3D geometry using OpenRouter AI
  app.post("/api/generate-geometry", async (req, res) => {
    try {
      const { description } = req.body;
      
      console.log("[API] Nhận request:", description);
      
      if (!description || typeof description !== "string") {
        console.log("[API] Thiếu mô tả");
        return res.status(400).json({ 
          error: "Vui lòng cung cấp mô tả hình không gian" 
        });
      }

      // Call OpenRouter API to generate 3D geometry
      console.log("[API] Gọi OpenRouter...");
      const result = await generateGeometry(description);
      
      console.log("[API] Thành công, trả về:", JSON.stringify(result).substring(0, 200));
      res.json(result);
    } catch (error: any) {
      console.error("[API] Lỗi:", error.message);
      console.error("[API] Stack:", error.stack);
      
      // Check if it's a rate limit error
      if (error.message?.includes("429") || error.message?.includes("rate")) {
        return res.status(429).json({ 
          error: "AI đang bị giới hạn số lượng request. Vui lòng đợi 30-60 giây rồi thử lại." 
        });
      }
      
      res.status(500).json({ 
        error: "AI không thể tạo hình 3D lúc này. Vui lòng thử lại sau.",
        details: error.message
      });
    }
  });

  // Calculate distance between geometric elements
  app.post("/api/calculate-distance", async (req, res) => {
    try {
      const { geometry, distanceMode, selectedElements } = req.body;
      
      console.log("[API] Distance calculation request:", distanceMode, selectedElements);
      
      if (!geometry || !distanceMode || !selectedElements || selectedElements.length !== 2) {
        return res.status(400).json({ 
          error: "Vui lòng cung cấp đầy đủ thông tin: geometry, distanceMode, và 2 selectedElements" 
        });
      }

      console.log("[API] Gọi AI để tính khoảng cách...");
      const result = await calculateDistance(geometry, distanceMode, selectedElements);
      
      console.log("[API] Kết quả tính toán:", result);
      res.json(result);
    } catch (error: any) {
      console.error("[API] Lỗi tính khoảng cách:", error.message);
      
      if (error.message?.includes("429") || error.message?.includes("rate")) {
        return res.status(429).json({ 
          error: "AI đang bị giới hạn số lượng request. Vui lòng đợi 30-60 giây rồi thử lại." 
        });
      }
      
      res.status(500).json({ 
        error: "AI không thể tính khoảng cách lúc này. Vui lòng thử lại sau.",
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
