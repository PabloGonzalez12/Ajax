const provinceSelect = document.getElementById("province");
const municipalitySelect = document.getElementById("municipality");
const fuelTypeSelect = document.getElementById("fuel-type");
const openCheckbox = document.getElementById("open");
const searchButton = document.getElementById("search");
const gasStationsList = document.getElementById("gas-stations-list");

// Base API URL
const BASE_URL = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes";

// Load provinces when the page is loaded
document.addEventListener("DOMContentLoaded", async () => {
    const provinces = await fetchData(`${BASE_URL}/Listados/Provincias/`);
    populateSelect(provinceSelect, provinces, "IDPovincia", "Provincia");
});

// Load municipalities when a province is selected
provinceSelect.addEventListener("change", async () => {
    const provinceId = provinceSelect.value;
    const municipalities = await fetchData(`${BASE_URL}/Listados/MunicipiosPorProvincia/${provinceId}`);
    populateSelect(municipalitySelect, municipalities, "IDMunicipio", "Municipio");
});

// Load fuel types when the page is loaded
document.addEventListener("DOMContentLoaded", async () => {
    const fuelTypes = [
        { IDProduct: "Precio Gasolina 95 E5", ProductName: "Gasoline 95 E5" },
        { IDProduct: "Precio Gasolina 98 E5", ProductName: "Gasoline 98 E5" },
        { IDProduct: "Precio Gasoleo A", ProductName: "Diesel A" },
        { IDProduct: "Precio Gasoleo Premium", ProductName: "Diesel Premium" }
    ];
    populateSelect(fuelTypeSelect, fuelTypes, "IDProduct", "ProductName");
});

// Search for gas stations when the search button is clicked
searchButton.addEventListener("click", async () => {
    const provinceId = provinceSelect.value;
    const municipalityId = municipalitySelect.value;
    const fuelTypeId = fuelTypeSelect.value;
    const isOpen = openCheckbox.checked;

    // Validate selection
    if (!provinceId) {
        alert("Please select a province.");
        return;
    }

    // Build the API URL based on filters
    let url = `${BASE_URL}/EstacionesTerrestres/FiltroProvincia/${provinceId}`;
    if (municipalityId) {
        url = `${BASE_URL}/EstacionesTerrestres/FiltroMunicipio/${municipalityId}`;
    }

    const response = await fetchData(url);

    if (!response.ListaEESSPrecio || response.ListaEESSPrecio.length === 0) {
        gasStationsList.innerHTML = "<p>No stations found.</p>";
        return;
    }

    // Filter stations based on fuel type and opening status
    const stations = response.ListaEESSPrecio;
    const filteredStations = stations.filter((station) => {
        const hasFuelType = fuelTypeId ? station[fuelTypeId] && station[fuelTypeId] !== "" : true;
        const isStationOpenNow = isOpen ? isStationInService(station.Horario) : true;
        return hasFuelType && isStationOpenNow;
    });

    displayStations(filteredStations, fuelTypeId);
});

// Station is open now
function isStationInService(schedule) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (schedule.includes("L-D: 24H")) return true;

    const daysMap = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 };
    const hours = schedule.split(";");

    for (const hour of hours) {
        const [days, timeRange] = hour.split(": ");
        const [startDay, endDay] = days.split("-").map((d) => daysMap[d.trim()]);
        const [start, end] = timeRange
            .split("-")
            .map((t) => t.split(":").reduce((h, m) => h * 60 + Number(m)));

        if (
            ((currentDay >= startDay && currentDay <= endDay) ||
                (endDay < startDay &&
                    (currentDay >= startDay || currentDay <= endDay))) &&
            ((currentTime >= start && currentTime <= end) ||
                (end < start && (currentTime >= start || currentTime <= end)))
        ) {
            return true;
        }
    }
    return false;
}

// Function to display stations
function displayStations(stations, fuelTypeId) {
    gasStationsList.innerHTML = "";

    if (stations.length === 0) {
        gasStationsList.innerHTML = "<p>No stations found.</p>";
        return;
    }

    stations.forEach((station) => {
        const stationElement = document.createElement("div");
        stationElement.classList.add("station");

        stationElement.innerHTML = `
            <h3>${station["Rótulo"]}</h3>
            <p><strong>Address:</strong> ${station["Dirección"]}, ${station["Municipio"]}, ${station["Provincia"]}</p>
            <p><strong>Fuel Price (${fuelTypeSelect.options[fuelTypeSelect.selectedIndex]?.text}):</strong> ${
                station[fuelTypeId] || "N/A"
            }</p>
            <p><strong>Schedule:</strong> ${station["Horario"]}</p>
        `;

        gasStationsList.appendChild(stationElement);
    });
}

// Function to make API requests
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        return {};
    }
}

// Function to populate a select
function populateSelect(selectElement, items, valueKey, textKey) {
    selectElement.innerHTML = `<option selected disabled>Select an option</option>`;
    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[valueKey];
        option.textContent = item[textKey];
        selectElement.appendChild(option);
    });
}