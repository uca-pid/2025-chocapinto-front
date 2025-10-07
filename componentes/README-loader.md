# 📝 Componente Loader

Un componente reutilizable para mostrar indicadores de carga con animación de libros girando.

## 🚀 Características

- **Reutilizable**: Funciona en cualquier página de la aplicación
- **Autocreación**: Se crea automáticamente en el DOM cuando es necesario
- **Personalizable**: Permite mensajes personalizados
- **Fácil de usar**: API simple con métodos intuitivos
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Animación suave**: Transiciones CSS optimizadas

## 📦 Instalación

```javascript
// Importar el componente
import { showLoader, hideLoader, appLoader } from "../componentes/loader.js";
```

## 🎯 Uso Básico

### Funciones simples (recomendado)

```javascript
// Mostrar loader
showLoader();

// Mostrar con mensaje personalizado
showLoader("Cargando datos...");

// Ocultar loader
hideLoader();
```

### Instancia del componente

```javascript
// Mostrar loader
appLoader.show();

// Mostrar con mensaje personalizado
appLoader.show("Procesando información...");

// Ocultar loader
appLoader.hide();

// Mostrar por tiempo determinado
appLoader.showFor(3000, "Guardando..."); // 3 segundos

// Verificar si está visible
if (appLoader.isShowing()) {
    console.log("El loader está activo");
}
```

## 🔧 API Completa

### Métodos del LoaderComponent

| Método | Parámetros | Descripción |
|--------|------------|-------------|
| `show(message)` | `string` (opcional) | Muestra el loader con mensaje opcional |
| `hide()` | - | Oculta el loader |
| `showFor(duration, message)` | `number`, `string` | Muestra por tiempo determinado |
| `isShowing()` | - | Retorna `true` si está visible |
| `destroy()` | - | Elimina el componente del DOM |

### Funciones de conveniencia

| Función | Parámetros | Descripción |
|---------|------------|-------------|
| `showLoader(message)` | `string` (opcional) | Muestra el loader |
| `hideLoader()` | - | Oculta el loader |

## 💡 Ejemplos de Uso

### En una función async

```javascript
async function cargarDatos() {
    try {
        showLoader("Cargando datos...");
        
        const response = await fetch('/api/data');
        const data = await response.json();
        
        // Procesar datos...
        
    } catch (error) {
        console.error("Error:", error);
    } finally {
        hideLoader();
    }
}
```

### Con timeout automático

```javascript
// Mostrar por 2 segundos
appLoader.showFor(2000, "Procesando...");
```

### Verificar estado

```javascript
if (!appLoader.isShowing()) {
    showLoader("Iniciando proceso...");
}
```

## 🎨 Personalización

### CSS Variables

El componente usa variables CSS que puedes personalizar:

```css
.loader {
    --background: linear-gradient(135deg, #23C4F8, #275EFE);
    --shadow: rgba(39, 94, 254, 0.28);
    --text: #6C7486;
    --page: rgba(255, 255, 255, 0.36);
    --page-fold: rgba(255, 255, 255, 0.52);
    --duration: 3s;
}
```

### Personalizar colores

```css
#app-loader.loader {
    --background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    --text: #2f3640;
}
```

## 🚨 Buenas Prácticas

1. **Siempre ocultar el loader**: Usa `try-finally` para asegurar que se oculte
2. **Mensajes descriptivos**: Usa mensajes claros para el usuario
3. **No anidar loaders**: Evita mostrar múltiples loaders simultáneamente
4. **Timeout en requests**: Usa `showFor()` para evitar loaders infinitos

## 🐛 Troubleshooting

### El loader no aparece
- Verifica que el CSS esté importado: `loader.css`
- Asegúrate de llamar `showLoader()` después de que el DOM esté listo

### Estilos no se aplican
- Verifica que no haya conflictos de CSS
- Asegúrate de que el z-index sea suficientemente alto

### El loader no se oculta
- Siempre usa `hideLoader()` en bloques `finally`
- Verifica que no haya errores JavaScript que interrumpan la ejecución

## 🔄 Migración desde loader manual

Si tenías un loader manual en HTML, simplemente:

1. Elimina el HTML del loader
2. Importa el componente
3. Usa `showLoader()` y `hideLoader()`

```javascript
// Antes
document.getElementById("loader").style.display = "flex";

// Ahora
showLoader();
```

## 🎯 Casos de Uso

- ✅ Carga de datos desde APIs
- ✅ Procesamiento de formularios
- ✅ Operaciones de archivo
- ✅ Navegación entre páginas
- ✅ Cualquier operación asíncrona

¡El componente es completamente plug-and-play! 🚀