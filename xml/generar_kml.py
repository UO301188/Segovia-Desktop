import xml.etree.ElementTree as ET
import os

class GeneradorKML:
    def __init__(self, archivo_xml):
        self.archivo_xml = archivo_xml

    def procesar_rutas(self):
        if not os.path.exists(self.archivo_xml):
            print(f"Error: No se encuentra {self.archivo_xml}")
            return
            
        tree = ET.parse(self.archivo_xml)
        root = tree.getroot()
        
        for ruta in root.findall('.//ruta'):
            hitos = ruta.find('hitos').findall('hito')
            if len(hitos) > 0:
                self._crear_archivo_kml(ruta, hitos)
                print(f"Generado KML para la ruta: {ruta.attrib['id']}")

    def _crear_archivo_kml(self, ruta, hitos):
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

if __name__ == "__main__":
    generador = GeneradorKML("rutas.xml")
    generador.procesar_rutas()