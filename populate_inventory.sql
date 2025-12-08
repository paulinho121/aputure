-- Script para popular o banco de dados com peças de exemplo
-- Execute este script no Supabase SQL Editor

-- Limpar dados existentes (opcional - comente se quiser manter dados existentes)
-- DELETE FROM parts;
-- DELETE FROM astera_parts;
-- DELETE FROM cream_source_parts;

-- ========================================
-- PEÇAS APUTURE
-- ========================================

INSERT INTO parts (name, code, category, quantity, min_stock, price, location, image_url) VALUES
-- LS Series
('LS 600d Pro', 'APT-LS600D', 'LED Lights', 5, 2, 8500.00, 'Prateleira A1', 'https://picsum.photos/seed/ls600d/200'),
('LS 600c Pro', 'APT-LS600C', 'LED Lights', 3, 2, 9200.00, 'Prateleira A1', 'https://picsum.photos/seed/ls600c/200'),
('LS 300d II', 'APT-LS300D2', 'LED Lights', 8, 3, 4800.00, 'Prateleira A2', 'https://picsum.photos/seed/ls300d/200'),
('LS 300x', 'APT-LS300X', 'LED Lights', 4, 2, 5200.00, 'Prateleira A2', 'https://picsum.photos/seed/ls300x/200'),
('LS 120d II', 'APT-LS120D2', 'LED Lights', 12, 4, 2100.00, 'Prateleira A3', 'https://picsum.photos/seed/ls120d/200'),
('LS 60d', 'APT-LS60D', 'LED Lights', 15, 5, 980.00, 'Prateleira A3', 'https://picsum.photos/seed/ls60d/200'),
('LS 60x', 'APT-LS60X', 'LED Lights', 10, 4, 1050.00, 'Prateleira A3', 'https://picsum.photos/seed/ls60x/200'),

-- Amaran Series
('Amaran 200d', 'APT-AM200D', 'LED Lights', 20, 6, 680.00, 'Prateleira B1', 'https://picsum.photos/seed/am200d/200'),
('Amaran 200x', 'APT-AM200X', 'LED Lights', 18, 6, 720.00, 'Prateleira B1', 'https://picsum.photos/seed/am200x/200'),
('Amaran 100d', 'APT-AM100D', 'LED Lights', 25, 8, 380.00, 'Prateleira B2', 'https://picsum.photos/seed/am100d/200'),
('Amaran 100x', 'APT-AM100X', 'LED Lights', 22, 8, 420.00, 'Prateleira B2', 'https://picsum.photos/seed/am100x/200'),
('Amaran P60c', 'APT-P60C', 'LED Panels', 30, 10, 280.00, 'Prateleira B3', 'https://picsum.photos/seed/p60c/200'),
('Amaran P60x', 'APT-P60X', 'LED Panels', 28, 10, 320.00, 'Prateleira B3', 'https://picsum.photos/seed/p60x/200'),

-- Acessórios e Modificadores
('Light Dome II', 'APT-LDOME2', 'Modifiers', 15, 5, 850.00, 'Prateleira C1', 'https://picsum.photos/seed/ldome2/200'),
('Light Dome Mini II', 'APT-LDOMEM2', 'Modifiers', 20, 6, 420.00, 'Prateleira C1', 'https://picsum.photos/seed/ldomem2/200'),
('Fresnel 2X', 'APT-FRES2X', 'Modifiers', 12, 4, 680.00, 'Prateleira C2', 'https://picsum.photos/seed/fres2x/200'),
('Spotlight Mount', 'APT-SPOT', 'Modifiers', 10, 3, 1200.00, 'Prateleira C2', 'https://picsum.photos/seed/spot/200'),
('Barndoors', 'APT-BARN', 'Modifiers', 25, 8, 180.00, 'Prateleira C3', 'https://picsum.photos/seed/barn/200'),

-- Baterias e Fontes
('V-Mount Battery 99Wh', 'APT-BAT99', 'Power', 40, 15, 420.00, 'Gaveta D1', 'https://picsum.photos/seed/bat99/200'),
('V-Mount Battery 150Wh', 'APT-BAT150', 'Power', 30, 10, 680.00, 'Gaveta D1', 'https://picsum.photos/seed/bat150/200'),
('AC Power Supply LS 600', 'APT-AC600', 'Power', 8, 3, 380.00, 'Gaveta D2', 'https://picsum.photos/seed/ac600/200'),
('AC Power Supply LS 300', 'APT-AC300', 'Power', 12, 4, 280.00, 'Gaveta D2', 'https://picsum.photos/seed/ac300/200'),

-- Cabos e Conectores
('DMX Cable 5m', 'APT-DMX5', 'Cables', 50, 20, 85.00, 'Gaveta E1', 'https://picsum.photos/seed/dmx5/200'),
('Power Cable 10m', 'APT-PWR10', 'Cables', 45, 15, 120.00, 'Gaveta E1', 'https://picsum.photos/seed/pwr10/200'),
('Extension Cable 5m', 'APT-EXT5', 'Cables', 60, 25, 95.00, 'Gaveta E2', 'https://picsum.photos/seed/ext5/200');

-- ========================================
-- PEÇAS ASTERA
-- ========================================

INSERT INTO astera_parts (name, code, category, quantity, min_stock, price, location, image_url) VALUES
-- Titan Tubes
('Titan Tube', 'AST-TITAN', 'LED Tubes', 24, 8, 1850.00, 'Prateleira F1', 'https://picsum.photos/seed/titan/200'),
('Helios Tube', 'AST-HELIOS', 'LED Tubes', 18, 6, 1450.00, 'Prateleira F1', 'https://picsum.photos/seed/helios/200'),
('Hyperion Tube', 'AST-HYPER', 'LED Tubes', 12, 4, 2200.00, 'Prateleira F2', 'https://picsum.photos/seed/hyper/200'),

-- NYX Bulbs
('NYX Bulb', 'AST-NYX', 'LED Bulbs', 40, 15, 680.00, 'Prateleira F3', 'https://picsum.photos/seed/nyx/200'),
('AX1 PixelBrick', 'AST-AX1', 'LED Panels', 20, 6, 950.00, 'Prateleira F3', 'https://picsum.photos/seed/ax1/200'),

-- Acessórios Astera
('Charging Case Titan (8 tubes)', 'AST-CASE8', 'Cases', 6, 2, 3200.00, 'Armário G1', 'https://picsum.photos/seed/case8/200'),
('Charging Case Helios (8 tubes)', 'AST-CASEH8', 'Cases', 4, 2, 2800.00, 'Armário G1', 'https://picsum.photos/seed/caseh8/200'),
('Power Supply Titan', 'AST-PSTITAN', 'Power', 15, 5, 280.00, 'Gaveta G2', 'https://picsum.photos/seed/pstitan/200'),
('Mounting Clip', 'AST-CLIP', 'Accessories', 80, 30, 45.00, 'Gaveta G3', 'https://picsum.photos/seed/clip/200'),
('Diffusion Dome', 'AST-DOME', 'Modifiers', 30, 10, 120.00, 'Prateleira G4', 'https://picsum.photos/seed/dome/200');

-- ========================================
-- PEÇAS CREAM SOURCE
-- ========================================

INSERT INTO cream_source_parts (name, code, category, quantity, min_stock, price, location, image_url) VALUES
-- Vortex Series
('Vortex8', 'CS-VTX8', 'LED Panels', 8, 3, 4200.00, 'Prateleira H1', 'https://picsum.photos/seed/vtx8/200'),
('Vortex4', 'CS-VTX4', 'LED Panels', 12, 4, 2800.00, 'Prateleira H1', 'https://picsum.photos/seed/vtx4/200'),

-- Doppio Series
('Doppio', 'CS-DOPPIO', 'LED Panels', 10, 3, 3500.00, 'Prateleira H2', 'https://picsum.photos/seed/doppio/200'),

-- Mini Series
('Mini', 'CS-MINI', 'LED Panels', 15, 5, 1800.00, 'Prateleira H2', 'https://picsum.photos/seed/mini/200'),
('Mini Colour', 'CS-MINIC', 'LED Panels', 12, 4, 2100.00, 'Prateleira H2', 'https://picsum.photos/seed/minic/200'),

-- Acessórios Cream Source
('Dome Diffuser Vortex8', 'CS-DOME8', 'Modifiers', 10, 3, 450.00, 'Prateleira H3', 'https://picsum.photos/seed/dome8/200'),
('Dome Diffuser Vortex4', 'CS-DOME4', 'Modifiers', 15, 5, 320.00, 'Prateleira H3', 'https://picsum.photos/seed/dome4/200'),
('Barndoor Set Vortex8', 'CS-BARN8', 'Modifiers', 8, 3, 580.00, 'Prateleira H4', 'https://picsum.photos/seed/barn8/200'),
('Power Supply Vortex8', 'CS-PS8', 'Power', 10, 3, 380.00, 'Gaveta H5', 'https://picsum.photos/seed/ps8/200'),
('Yoke Mount', 'CS-YOKE', 'Accessories', 20, 6, 220.00, 'Gaveta H5', 'https://picsum.photos/seed/yoke/200');

-- Verificar dados inseridos
SELECT 'Aputure Parts' as Manufacturer, COUNT(*) as Total FROM parts
UNION ALL
SELECT 'Astera Parts', COUNT(*) FROM astera_parts
UNION ALL
SELECT 'Cream Source Parts', COUNT(*) FROM cream_source_parts;
