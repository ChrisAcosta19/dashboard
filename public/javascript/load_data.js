import {tiempoArr, precipitacionArr, uvArr, temperaturaArr} from './static_data.js';
let fechaActual = () => new Date().toISOString().slice(0,10);

let cargarPrecipitacion = () => {

    //Obtenga la función fechaActual
    let actual = fechaActual();
    //Defina un arreglo temporal vacío
    let datos = []
    //Itere en el arreglo tiempoArr para filtrar los valores de precipitacionArr que sean igual con la fecha actual
    for (let index = 0; index < tiempoArr.length; index++) {
        const tiempo = tiempoArr[index];
        const precipitacion = precipitacionArr[index]
    
        if(tiempo.includes(actual)) {
          datos.push(precipitacion)
        }
      }
    //Con los valores filtrados, obtenga los valores máximo, promedio y mínimo
    let max = Math.max(...datos)
    let min = Math.min(...datos)
    let sum = datos.reduce((a, b) => a + b, 0);
    let prom = (sum / datos.length) || 0;
    //Obtenga la referencia a los elementos HTML con id precipitacionMinValue, precipitacionPromValue y precipitacionMaxValue
    let precipitacionMinValue = document.getElementById("precipitacionMinValue")
    let precipitacionPromValue = document.getElementById("precipitacionPromValue")
    let precipitacionMaxValue = document.getElementById("precipitacionMaxValue")
    //Actualice los elementos HTML con los valores correspondientes
    precipitacionMinValue.textContent = `Min ${min} [mm]`
    precipitacionPromValue.textContent = `Prom ${ Math.round(prom * 100) / 100 } [mm]`
    precipitacionMaxValue.textContent = `Max ${max} [mm]`
  }

  let cargarFechaActual = () => {
  
    //Obtenga la referencia al elemento h6
    let coleccionHTML = document.getElementsByTagName("h6")
    let tituloH6 = coleccionHTML[0]
    //Actualice la referencia al elemento h6 con el valor de la función fechaActual()
    tituloH6.textContent = fechaActual()
  }

  let cargarOpenMeteo1 = () => {

    //URL que responde con la respuesta a cargar
    let URL = 'https://api.open-meteo.com/v1/forecast?latitude=-2.1962&longitude=-79.8862&hourly=temperature_2m&timezone=auto'; 
  
    fetch( URL )
      .then(responseText => responseText.json())
      .then(responseJSON => {
        
        //Respuesta en formato JSON
    
        //Referencia al elemento con el identificador plot
        let plotRef = document.getElementById('plot1');
    
        //Etiquetas del gráfico
        let labels = responseJSON.hourly.time;
    
        //Etiquetas de los datos
        let data = responseJSON.hourly.temperature_2m;
    
        //Objeto de configuración del gráfico
        let config = {
          type: 'line',
          data: {
            labels: labels, 
            datasets: [
              {
                label: 'Temperature [2m]',
                data: data, 
              }
            ]
          }
        };
    
        //Objeto con la instanciación del gráfico
        let chart1  = new Chart(plotRef, config);
    
      })
      .catch(console.error);
  
  }

  let cargarOpenMeteo2 = () => {

    //URL que responde con la respuesta a cargar
    let URL = 'https://api.open-meteo.com/v1/forecast?latitude=-2.1962&longitude=-79.8862&hourly=precipitation_probability&timezone=auto'; 
  
    fetch( URL )
      .then(responseText => responseText.json())
      .then(responseJSON => {
        
        //Respuesta en formato JSON
    
        //Referencia al elemento con el identificador plot
        let plotRef = document.getElementById('plot2');
    
        //Etiquetas del gráfico
        let labels = responseJSON.hourly.time;
    
        //Etiquetas de los datos
        let data = responseJSON.hourly.precipitation_probability;
    
        //Objeto de configuración del gráfico
        let config = {
          type: 'line',
          data: {
            labels: labels, 
            datasets: [
              {
                label: 'Precipitation Probability',
                data: data, 
              }
            ]
          }
        };
    
        //Objeto con la instanciación del gráfico
        let chart2  = new Chart(plotRef, config);
    
      })
      .catch(console.error);
  
  }
  
  cargarPrecipitacion()
  cargarFechaActual()
  cargarOpenMeteo1()
  cargarOpenMeteo2()

  let parseXML = (responseText) => {

    const parser = new DOMParser();
    const xml = parser.parseFromString(responseText, "application/xml");


    // Referencia al elemento `#forecastbody` del documento HTML

    let forecastElement = document.querySelector("#forecastbody")
    forecastElement.innerHTML = ''

    // Procesamiento de los elementos con etiqueta `<time>` del objeto xml
    let timeArr = xml.querySelectorAll("time")

    timeArr.forEach(time => {
        
        let from = time.getAttribute("from").replace("T", " ")

        let humidity = time.querySelector("humidity").getAttribute("value")
        let windSpeed = time.querySelector("windSpeed").getAttribute("mps")
        let precipitation = time.querySelector("precipitation").getAttribute("probability")
        let pressure = time.querySelector("pressure").getAttribute("value")
        let cloud = time.querySelector("clouds").getAttribute("value")

        let template = `
            <tr>
                <td>${from}</td>
                <td>${humidity}</td>
                <td>${windSpeed}</td>
                <td>${precipitation}</td>
                <td>${pressure}</td>
                <td>${cloud}</td>
            </tr>
        `

        //Renderizando la plantilla en el elemento HTML
        forecastElement.innerHTML += template;
    })

}
  
  // Función para realizar la actualización de datos y almacenar en el LocalStorage
async function actualizarYAlmacenarDatos(selectedCity) {
  try {
    // API key
    const APIkey = '5536ee0de59d9762d8d82714f7b3d8d8';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${selectedCity}&mode=xml&appid=${APIkey}`;

    const response = await fetch(url);
    const responseText = await response.text();

    await parseXML(responseText);
    // Guarda la entrada en el LocalStorage
    await localStorage.setItem(selectedCity, responseText);

  } catch (error) {
    console.log(error);
  }
}

// Función para obtener datos del LocalStorage o actualizar si han pasado 3 horas
async function obtenerDatos(selectedCity) {
  const ahora = new Date().getTime();
  const cityStorage = localStorage.getItem(selectedCity);
  let ultimaActualizacion = localStorage.getItem(`${selectedCity}_ultima_actualizacion`);

  if (cityStorage == null || !ultimaActualizacion) {
    // Si no hay datos o no hay registro de última actualización, realiza la actualización
    await actualizarYAlmacenarDatos(selectedCity);
    ultimaActualizacion = ahora;
    localStorage.setItem(`${selectedCity}_ultima_actualizacion`, ahora);
  } else {
    ultimaActualizacion = parseInt(ultimaActualizacion);

    // Si han pasado 3 horas desde la última actualización, actualiza los datos
    if (ahora - ultimaActualizacion >= 3 * 60 * 60 * 1000) { // 3 horas en milisegundos
      await actualizarYAlmacenarDatos(selectedCity);
      ultimaActualizacion = ahora;
      localStorage.setItem(`${selectedCity}_ultima_actualizacion`, ahora);
    }
  }

  // Procesa los datos
  parseXML(cityStorage);
}

// Callback async
let selectListener = async (event) => {
  const selectedCity = event.target.value;
  console.log(selectedCity);

  await obtenerDatos(selectedCity);
}
  
  let loadForecastByCity = () => {

    //Handling event
    let selectElement = document.querySelector("select")
    selectElement.addEventListener("change", selectListener)
  
  }
  loadForecastByCity()

  let loadExternalTable = async () => {
    try {
      // Realizar una petición asíncrona al endpoint
      let URL = 'https://www.gestionderiesgos.gob.ec/monitoreo-de-inundaciones/'
      let proxyURL = 'https://cors-anywhere.herokuapp.com/'
      let endpoint = proxyURL + URL
      const response = await fetch(endpoint);
  
      // Verificar si la petición fue exitosa (código de estado 200)
      if (!response.ok) {
        throw new Error('Error en la petición');
      }
  
      // Convertir la respuesta a texto
      const htmlText = await response.text();
  
      // Crear un objeto DOM a partir de la cadena HTML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(htmlText, 'text/html');
  
      // Extraer el elemento del objeto XML usando querySelector
      const tableElement = xmlDoc.querySelector('#postcontent table');
  
      // Obtener el elemento del DOM por su ID
      const monitoreoElement = document.getElementById('monitoreo');
  
      // Asignar el contenido del elemento XML al contenido del elemento DOM
      monitoreoElement.innerHTML = tableElement.outerHTML;
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // Llamar a la función
  loadExternalTable();  