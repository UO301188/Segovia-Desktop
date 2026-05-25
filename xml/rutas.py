import xml.etree.ElementTree as ET
import os

def generar_kml(ruta, hitos):
    id_ruta = ruta.attrib['id']
    nombre_ruta = ruta.find('nombre').text
    kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Planimetría {nombre_ruta}</name>
    <Style id="lineaRoja">
      <LineStyle>
        <color>ff0000ff</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>Ruta</name>
      <styleUrl>#lineaRoja</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <coordinates>
"""
    # Añadir coordenadas de cada hito a la LineString
    for hito in hitos:
        coords = hito.find('coordenadas')
        lon = coords.find('longitud').text
        lat = coords.find('latitud').text
        alt = coords.find('altitud').text
        kml_content += f"          {lon},{lat},{alt}\n"
        
    kml_content += """        </coordinates>
      </LineString>
    </Placemark>
"""
    # Añadir marcadores (Placemarks) individuales
    for hito in hitos:
        nombre_hito = hito.find('nombre').text
        desc_hito = hito.find('descripcion').text
        coords = hito.find('coordenadas')
        lon = coords.find('longitud').text
        lat = coords.find('latitud').text
        kml_content += f"""
    <Placemark>
      <name>{nombre_hito}</name>
      <description>{desc_hito}</description>
      <Point>
        <coordinates>{lon},{lat},0</coordinates>
      </Point>
    </Placemark>
"""
    kml_content += """  </Document>
</kml>
"""
    with open(f"planimetria_{id_ruta}.kml", "w", encoding="utf-8") as f:
        f.write(kml_content)


def generar_svg(ruta, hitos):
    id_ruta = ruta.attrib['id']
    
    ancho = 800
    alto = 400
    margen = 50
    
    puntos = []
    distancia_acumulada = 0
    max_alt = 0
    min_alt = float('inf')
    
    # Primera pasada: calcular máximos y mínimos
    datos_grafico = []
    for hito in hitos:
        alt = float(hito.find('coordenadas').find('altitud').text)
        dist_elem = hito.find('distancia')
        dist_val = float(dist_elem.text) if dist_elem is not None else 0
        
        # Convertir a metros si viene en km para la escala horizontal
        if dist_elem is not None and dist_elem.attrib.get('unidades') == 'km':
            dist_val *= 1000
            
        distancia_acumulada += dist_val
        
        if alt > max_alt: max_alt = alt
        if alt < min_alt: min_alt = alt
            
        datos_grafico.append((distancia_acumulada, alt))
        
    total_distancia = max(distancia_acumulada, 1) # Evitar división por cero
    rango_alt = max(max_alt - min_alt, 1)
    
    # Construir polyline y transformar escalas
    svg_points = ""
    for d, a in datos_grafico:
        # Mapeo al lienzo SVG
        x = margen + (d / total_distancia) * (ancho - 2 * margen)
        y = alto - margen - ((a - min_alt) / rango_alt) * (alto - 2 * margen)
        svg_points += f"{x},{y} "
        
    svg_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg width="{ancho}" height="{alto}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#F8F4EC"/>
    <line x1="{margen}" y1="{alto - margen}" x2="{ancho - margen}" y2="{alto - margen}" stroke="black" stroke-width="2"/>
    <line x1="{margen}" y1="{margen}" x2="{margen}" y2="{alto - margen}" stroke="black" stroke-width="2"/>
    
    <text x="{ancho/2}" y="{alto - 15}" font-family="Arial" font-size="14" text-anchor="middle">Distancia Total ({total_distancia} m)</text>
    <text x="15" y="{alto/2}" font-family="Arial" font-size="14" transform="rotate(-90 15,{alto/2})" text-anchor="middle">Altitud (m)</text>
    
    <text x="{margen - 5}" y="{margen + 5}" font-family="Arial" font-size="12" text-anchor="end">{max_alt}m</text>
    <text x="{margen - 5}" y="{alto - margen}" font-family="Arial" font-size="12" text-anchor="end">{min_alt}m</text>

    <polyline points="{margen},{alto-margen} {svg_points} {ancho-margen},{alto-margen}" fill="#D4C5A0" stroke="#8B1A1A" stroke-width="3" opacity="0.7"/>
</svg>
"""
    with open(f"altimetria_{id_ruta}.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)


def main():
    if not os.path.exists("rutas.xml"):
        print("Error: No se encuentra rutas.xml")
        return
        
    tree = ET.parse("rutas.xml")
    root = tree.getroot()
    
    # Como el XML no utiliza namespace en las etiquetas aunque lo declare en la raiz, las busquedas son directas
    for ruta in root.findall('.//ruta'):
        hitos = ruta.find('hitos').findall('hito')
        if len(hitos) > 0:
            generar_kml(ruta, hitos)
            generar_svg(ruta, hitos)
            print(f"Generados KML y SVG para la ruta: {ruta.attrib['id']}")

if __name__ == "__main__":
    main()