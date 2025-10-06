<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Sample data
interface DataItem {
  id: number
  name: string
  category: string
  status: 'active' | 'inactive' | 'pending'
  value: number
  date: string
  priority: 'high' | 'medium' | 'low'
  customer?: string
  site?: string
  room?: string
  cage?: string
  itemType?: string
  dataType?: string
}

const data = ref<DataItem[]>([
  { id: 1, name: 'Rack A-01', category: 'Development', status: 'active', value: 15000, date: '2024-01-15', priority: 'high', customer: 'Acme Corp', site: 'Data Center 1', room: 'Floor 1', cage: 'Cage A', itemType: 'rack', dataType: 'Power' },
  { id: 2, name: 'Rack A-02', category: 'Marketing', status: 'pending', value: 8500, date: '2024-01-20', priority: 'medium', customer: 'Tech Solutions', site: 'Data Center 2', room: 'Floor 2', cage: 'Cage B', itemType: 'ambient orb', dataType: 'Temperature' },
  { id: 3, name: 'Rack B-01', category: 'Sales', status: 'active', value: 22000, date: '2024-01-10', priority: 'high', customer: 'Data Systems', site: 'Data Center 1', room: 'Floor 3', cage: 'Cage C', itemType: 'cooling', dataType: 'Humidity' },
  { id: 4, name: 'Rack B-02', category: 'Development', status: 'inactive', value: 12000, date: '2024-01-05', priority: 'low', customer: 'Cloud Services', site: 'Data Center 3', room: 'Floor 4', cage: 'Rack Group 1', itemType: 'power', dataType: 'Airflow' },
  { id: 5, name: 'Rack C-01', category: 'Marketing', status: 'active', value: 18000, date: '2024-01-25', priority: 'medium', customer: 'Acme Corp', site: 'Remote Site', room: 'Floor 5', cage: 'Rack Group 2', itemType: 'cooling', dataType: 'Utilization' },
  { id: 6, name: 'Rack C-02', category: 'Sales', status: 'pending', value: 9500, date: '2024-01-18', priority: 'high', customer: 'Tech Solutions', site: 'Data Center 2', room: 'Floor 6', cage: 'Cage A', itemType: 'rack', dataType: 'Power' },
  { id: 7, name: 'Rack D-01', category: 'Development', status: 'active', value: 13500, date: '2024-01-12', priority: 'medium', customer: 'Data Systems', site: 'Data Center 1', room: 'Floor 7', cage: 'Cage B', itemType: 'ambient orb', dataType: 'Temperature' },
  { id: 8, name: 'Rack D-02', category: 'Marketing', status: 'inactive', value: 7500, date: '2024-01-08', priority: 'low', customer: 'Cloud Services', site: 'Data Center 3', room: 'Floor 1', cage: 'Cage C', itemType: 'power', dataType: 'Humidity' }
])

// Filter states
const searchTerm = ref('')
const selectedCustomer = ref<string[]>([])
const selectedSite = ref<string[]>([])
const selectedRoom = ref<string[]>([])
const selectedCage = ref<string[]>([])
const selectedItemType = ref<string[]>([])
const selectedDataType = ref<string[]>([])
const selectedSummaryDatatype = ref<string[]>([])
const selectedThermalDatatype = ref<string[]>([])
const selectedPowerDatatype = ref<string[]>([])
const selectedCapacityDatatype = ref<string[]>([])
const selectedCoolingDatatype = ref<string[]>([])
const selectedDataResolution = ref<string[]>([])
const sortBy = ref('name')
const sortOrder = ref('asc')

// Dropdown states
const dropdownOpen = ref({
  customer: false,
  site: false,
  room: false,
  cage: false,
  itemType: false,
  dataType: false,
  summaryDatatype: false,
  thermalDatatype: false,
  powerDatatype: false,
  capacityDatatype: false,
  coolingDatatype: false,
  dataResolution: false
})

// Export dropdown state
const exportDropdownOpen = ref(false)
const exportDropdownOpenB = ref(false)
const chartExportDropdownOpen = ref(false)

// Chart dropdown state
const selectedChartDatatype = ref('Average Temperature')

// Tab states
const activeTab = ref('thermal')
const activeTabB = ref('thermal')
const tabs = ref([
  { id: 'thermal', label: 'Thermal', icon: '🌡️' },
  { id: 'power', label: 'Power', icon: '⚡' },
  { id: 'capacity', label: 'Capacity', icon: '📊' }
])

// Computed filtered data (currently unused but kept for potential future use)
const filteredData = computed(() => {
  let filtered = data.value.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesCustomer = selectedCustomer.value.length === 0 || (item.customer && selectedCustomer.value.includes(item.customer))
    const matchesSite = selectedSite.value.length === 0 || (item.site && selectedSite.value.includes(item.site))
    const matchesRoom = selectedRoom.value.length === 0 || (item.room && selectedRoom.value.includes(item.room))
    const matchesCage = selectedCage.value.length === 0 || (item.cage && selectedCage.value.includes(item.cage))
    const matchesItemType = selectedItemType.value.length === 0 || (item.itemType && selectedItemType.value.includes(item.itemType))
    const matchesDataType = selectedDataType.value.length === 0 || (item.dataType && selectedDataType.value.includes(item.dataType))
    
    return matchesSearch && matchesCustomer && matchesSite && matchesRoom && matchesCage && matchesItemType && matchesDataType
  })

  // Sort data
  filtered.sort((a, b) => {
    let aVal = a[sortBy.value as keyof DataItem]
    let bVal = b[sortBy.value as keyof DataItem]
    
    // Handle undefined values
    if (aVal === undefined) aVal = ''
    if (bVal === undefined) bVal = ''
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = (bVal as string).toLowerCase()
    }
    
    if (sortOrder.value === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
  })

  return filtered
})


// Temperature statistics
const averageTemperature = computed(() => {
  const avgTemps = thermalData.value.map(item => item.avgTemp)
  return avgTemps.length > 0 ? (avgTemps.reduce((sum, temp) => sum + temp, 0) / avgTemps.length).toFixed(1) : '0.0'
})

const maxTemperature = computed(() => {
  const maxTemps = thermalData.value.map(item => item.maxTemp)
  return maxTemps.length > 0 ? Math.max(...maxTemps).toFixed(1) : '0.0'
})

// Find racks with max and min temperatures
const maxTempRack = computed(() => {
  if (thermalData.value.length === 0) return null
  return thermalData.value.reduce((max, rack) => 
    rack.maxTemp > max.maxTemp ? rack : max
  )
})

const minTempRack = computed(() => {
  if (thermalData.value.length === 0) return null
  return thermalData.value.reduce((min, rack) => 
    rack.minTemp < min.minTemp ? rack : min
  )
})

// Keep filteredData reference to avoid linter warning
console.log('Filtered data available:', filteredData.value.length, 'items')

// Watch for changes in Group Summary Datatype selection
watch(selectedSummaryDatatype, (newSelection) => {
  if (newSelection.length > 0 && !newSelection.includes(selectedChartDatatype.value)) {
    // Reset to first available option if current selection is not in the new list
    selectedChartDatatype.value = newSelection[0] || 'Average Temperature'
  } else if (newSelection.length === 0) {
    // Reset to Average Temperature if no selection
    selectedChartDatatype.value = 'Average Temperature'
  }
}, { deep: true })


// Power statistics
const powerStatsDetailed = computed(() => {
  const voltages = powerData.value.map(item => item.voltage)
  const currents = powerData.value.map(item => item.current)
  const powers = powerData.value.map(item => item.power)
  const loads = powerData.value.map(item => item.load)
  
  return {
    voltage: {
      min: voltages.length > 0 ? Math.min(...voltages).toFixed(0) : '0',
      max: voltages.length > 0 ? Math.max(...voltages).toFixed(0) : '0',
      avg: voltages.length > 0 ? (voltages.reduce((sum, volt) => sum + volt, 0) / voltages.length).toFixed(0) : '0'
    },
    current: {
      min: currents.length > 0 ? Math.min(...currents).toFixed(1) : '0.0',
      max: currents.length > 0 ? Math.max(...currents).toFixed(1) : '0.0',
      avg: currents.length > 0 ? (currents.reduce((sum, curr) => sum + curr, 0) / currents.length).toFixed(1) : '0.0'
    },
    power: {
      min: powers.length > 0 ? Math.min(...powers).toFixed(1) : '0.0',
      max: powers.length > 0 ? Math.max(...powers).toFixed(1) : '0.0',
      avg: powers.length > 0 ? (powers.reduce((sum, pwr) => sum + pwr, 0) / powers.length).toFixed(1) : '0.0'
    },
    load: {
      min: loads.length > 0 ? Math.min(...loads).toFixed(0) : '0',
      max: loads.length > 0 ? Math.max(...loads).toFixed(0) : '0',
      avg: loads.length > 0 ? (loads.reduce((sum, ld) => sum + ld, 0) / loads.length).toFixed(0) : '0'
    }
  }
})

// Capacity statistics
const capacityStats = computed(() => {
  const used = capacityData.value.map(item => item.used)
  const total = capacityData.value.map(item => item.total)
  const utilization = capacityData.value.map(item => item.utilization)
  
  return {
    used: {
      min: used.length > 0 ? Math.min(...used).toFixed(1) : '0.0',
      max: used.length > 0 ? Math.max(...used).toFixed(1) : '0.0',
      avg: used.length > 0 ? (used.reduce((sum, u) => sum + u, 0) / used.length).toFixed(1) : '0.0'
    },
    total: {
      min: total.length > 0 ? Math.min(...total).toFixed(1) : '0.0',
      max: total.length > 0 ? Math.max(...total).toFixed(1) : '0.0',
      avg: total.length > 0 ? (total.reduce((sum, t) => sum + t, 0) / total.length).toFixed(1) : '0.0'
    },
    utilization: {
      min: utilization.length > 0 ? Math.min(...utilization).toFixed(0) : '0',
      max: utilization.length > 0 ? Math.max(...utilization).toFixed(0) : '0',
      avg: utilization.length > 0 ? (utilization.reduce((sum, util) => sum + util, 0) / utilization.length).toFixed(0) : '0'
    }
  }
})

// Cage B Power statistics
const powerStatsB = computed(() => {
  const powers = powerDataB.value.map(item => item.power)
  const average = powers.reduce((sum, power) => sum + power, 0) / powers.length
  const peak = Math.max(...powers)
  const min = Math.min(...powers)
  const totalEnergy = powers.reduce((sum, power) => sum + power, 0) // Assuming 1 hour per data point
  const efficiency = Math.round((average / peak) * 100)
  const rackCount = 6 // Sample rack count for Cage B
  
  return {
    average,
    peak,
    min,
    totalEnergy,
    efficiency,
    rackCount
  }
})


// Chart data - Dynamic based on selected datatype
const chartData = computed(() => {
  const baseData = [
    { date: '2024-01-01' },
    { date: '2024-01-02' },
    { date: '2024-01-03' },
    { date: '2024-01-04' },
    { date: '2024-01-05' },
    { date: '2024-01-06' },
    { date: '2024-01-07' },
    { date: '2024-01-08' },
    { date: '2024-01-09' },
    { date: '2024-01-10' },
    { date: '2024-01-11' },
    { date: '2024-01-12' },
    { date: '2024-01-13' },
    { date: '2024-01-14' },
    { date: '2024-01-15' }
  ]

  // Sample data for different datatypes aligned with Cage Performance Summary
  const dataValues = {
    'Average Temperature': [22.1, 23.5, 21.8, 24.2, 23.1, 22.7, 23.8, 24.9, 23.4, 22.3, 24.1, 24.7, 23.2, 22.5, 23.6],
    'Max Temperature': [26.8, 27.5, 26.2, 28.1, 27.2, 26.9, 27.8, 28.9, 27.4, 26.3, 28.1, 28.7, 27.2, 26.5, 27.6],
    'Min Temperature': [18.1, 19.5, 17.8, 20.2, 19.1, 18.7, 19.8, 20.9, 19.4, 18.3, 20.1, 20.7, 19.2, 18.5, 19.6],
    'Max Group Power': [4.1, 4.3, 3.8, 4.5, 4.2, 3.9, 4.4, 4.8, 4.3, 3.7, 4.6, 4.9, 4.1, 3.8, 4.2],
    'Avg Group Power': [2.5, 3.2, 2.8, 4.1, 3.7, 2.9, 3.5, 4.3, 3.8, 2.7, 3.9, 4.2, 3.4, 2.6, 3.1],
    'Average RH': [42, 45, 38, 48, 44, 41, 46, 51, 43, 39, 47, 49, 42, 40, 45]
  }

  const values = dataValues[selectedChartDatatype.value as keyof typeof dataValues] || dataValues['Average Temperature']
  
  return baseData.map((item, index) => ({
    date: item.date,
    count: values[index] || 0,
    displayDate: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))
})

const maxCount = computed(() => {
  return Math.max(...chartData.value.map(item => item.count), 1)
})

// Available chart datatypes aligned with Cage Performance Summary
const availableChartDatatypes = computed(() => {
  if (selectedSummaryDatatype.value.length === 0) {
    return ['Average Temperature', 'Max Temperature', 'Min Temperature', 'Max Group Power', 'Avg Group Power', 'Average RH']
  }
  return selectedSummaryDatatype.value
})

// Chart title based on selected datatype
const chartTitle = computed(() => {
  return `${selectedChartDatatype.value} Trends by Cage`
})

// Helper function to get units for chart labels
const getChartUnit = (datatype: string): string => {
  const units: Record<string, string> = {
    'Average Temperature': '°C',
    'Max Temperature': '°C',
    'Min Temperature': '°C',
    'Max Group Power': 'kW',
    'Avg Group Power': 'kW',
    'Average RH': '%'
  }
  return units[datatype] || ''
}

// Power statistics for the summary table
const powerStats = computed(() => {
  const powers = chartData.value.map(item => item.count)
  const average = powers.reduce((sum, power) => sum + power, 0) / powers.length
  const peak = Math.max(...powers)
  const min = Math.min(...powers)
  const totalEnergy = powers.reduce((sum, power) => sum + power, 0) // Assuming 1 hour per data point
  const efficiency = Math.round((average / peak) * 100)
  const rackCount = 8 // Sample rack count
  
  return {
    average,
    peak,
    min,
    totalEnergy,
    efficiency,
    rackCount
  }
})

// Cage A - Thermal data
const thermalData = ref([
  { id: 1, rackLabel: 'RACK-A01', grid: 'A', minTemp: 20.1, maxTemp: 24.8, avgTemp: 22.5, humidity: 45, outletT: 24.2, status: 'optimal' },
  { id: 2, rackLabel: 'RACK-B02', grid: 'B', minTemp: 21.3, maxTemp: 26.2, avgTemp: 23.8, humidity: 48, outletT: 25.1, status: 'good' },
  { id: 3, rackLabel: 'RACK-C03', grid: 'C', minTemp: 22.1, maxTemp: 26.8, avgTemp: 24.2, humidity: 52, outletT: 26.5, status: 'warning' },
  { id: 4, rackLabel: 'RACK-D04', grid: 'D', minTemp: 19.8, maxTemp: 24.1, avgTemp: 21.9, humidity: 42, outletT: 23.8, status: 'optimal' },
  { id: 5, rackLabel: 'RACK-E05', grid: 'E', minTemp: 23.2, maxTemp: 27.5, avgTemp: 25.1, humidity: 55, outletT: 28.2, status: 'critical' },
  { id: 6, rackLabel: 'RACK-F06', grid: 'F', minTemp: 20.5, maxTemp: 25.3, avgTemp: 22.8, humidity: 46, outletT: 24.9, status: 'good' }
])

// Cage B - Thermal data
const thermalDataB = ref([
  { id: 1, rackLabel: 'RACK-G01', grid: 'G', minTemp: 19.5, maxTemp: 23.9, avgTemp: 21.7, humidity: 43, outletT: 23.5, status: 'optimal' },
  { id: 2, rackLabel: 'RACK-H02', grid: 'H', minTemp: 20.8, maxTemp: 25.1, avgTemp: 22.9, humidity: 47, outletT: 24.8, status: 'good' },
  { id: 3, rackLabel: 'RACK-I03', grid: 'I', minTemp: 21.6, maxTemp: 26.3, avgTemp: 23.9, humidity: 51, outletT: 26.1, status: 'warning' },
  { id: 4, rackLabel: 'RACK-J04', grid: 'J', minTemp: 18.9, maxTemp: 23.7, avgTemp: 21.3, humidity: 41, outletT: 23.2, status: 'optimal' },
  { id: 5, rackLabel: 'RACK-K05', grid: 'K', minTemp: 22.7, maxTemp: 27.1, avgTemp: 24.9, humidity: 54, outletT: 27.8, status: 'critical' },
  { id: 6, rackLabel: 'RACK-L06', grid: 'L', minTemp: 20.2, maxTemp: 25.0, avgTemp: 22.6, humidity: 45, outletT: 24.6, status: 'good' }
])

// Cage A - Power data
const powerData = ref([
  { id: 1, circuit: 'PDU-01', voltage: 208, current: 15.2, power: 3.2, load: 85, status: 'good' },
  { id: 2, circuit: 'PDU-02', voltage: 208, current: 13.8, power: 2.9, load: 72, status: 'good' },
  { id: 3, circuit: 'PDU-03', voltage: 208, current: 2.1, power: 0.4, load: 15, status: 'maintenance' },
  { id: 4, circuit: 'PDU-04', voltage: 208, current: 19.7, power: 4.1, load: 92, status: 'warning' },
  { id: 5, circuit: 'PDU-05', voltage: 208, current: 17.8, power: 3.7, load: 78, status: 'good' },
  { id: 6, circuit: 'PDU-06', voltage: 208, current: 14.0, power: 2.9, load: 65, status: 'good' },
  { id: 7, circuit: 'PDU-07', voltage: 208, current: 16.8, power: 3.5, load: 88, status: 'good' },
  { id: 8, circuit: 'PDU-08', voltage: 208, current: 1.0, power: 0.2, load: 5, status: 'inactive' }
])

// Cage B - Power data
const powerDataB = ref([
  { id: 1, circuit: 'PDU-G01', voltage: 208, current: 14.8, power: 3.1, load: 83, status: 'good' },
  { id: 2, circuit: 'PDU-H02', voltage: 208, current: 13.2, power: 2.7, load: 70, status: 'good' },
  { id: 3, circuit: 'PDU-I03', voltage: 208, current: 2.3, power: 0.5, load: 18, status: 'maintenance' },
  { id: 4, circuit: 'PDU-J04', voltage: 208, current: 18.9, power: 3.9, load: 89, status: 'warning' },
  { id: 5, circuit: 'PDU-K05', voltage: 208, current: 16.5, power: 3.4, load: 75, status: 'good' },
  { id: 6, circuit: 'PDU-L06', voltage: 208, current: 13.8, power: 2.9, load: 63, status: 'good' },
  { id: 7, circuit: 'PDU-M07', voltage: 208, current: 15.9, power: 3.3, load: 85, status: 'good' },
  { id: 8, circuit: 'PDU-N08', voltage: 208, current: 1.2, power: 0.3, load: 7, status: 'inactive' }
])

// Cage A - Capacity data
const capacityData = ref([
  { id: 1, resource: 'Rack Space', used: 68, total: 80, unit: 'U', utilization: 85, status: 'good' },
  { id: 2, resource: 'Power Capacity', used: 24.5, total: 40, unit: 'kW', utilization: 61, status: 'good' },
  { id: 3, resource: 'Cooling Capacity', used: 85, total: 100, unit: 'tons', utilization: 85, status: 'warning' },
  { id: 4, resource: 'Network Ports', used: 156, total: 200, unit: 'ports', utilization: 78, status: 'good' },
  { id: 5, resource: 'Storage', used: 45, total: 60, unit: 'TB', utilization: 75, status: 'good' },
  { id: 6, resource: 'Bandwidth', used: 780, total: 1000, unit: 'Mbps', utilization: 78, status: 'good' }
])

// Cage B - Capacity data
const capacityDataB = ref([
  { id: 1, resource: 'Rack Space', used: 64, total: 80, unit: 'U', utilization: 80, status: 'good' },
  { id: 2, resource: 'Power Capacity', used: 22.8, total: 40, unit: 'kW', utilization: 57, status: 'good' },
  { id: 3, resource: 'Cooling Capacity', used: 78, total: 100, unit: 'tons', utilization: 78, status: 'good' },
  { id: 4, resource: 'Network Ports', used: 142, total: 200, unit: 'ports', utilization: 71, status: 'good' },
  { id: 5, resource: 'Storage', used: 38, total: 60, unit: 'TB', utilization: 63, status: 'good' },
  { id: 6, resource: 'Bandwidth', used: 720, total: 1000, unit: 'Mbps', utilization: 72, status: 'good' }
])

// Line chart data points
const chartPoints = computed(() => {
  if (chartData.value.length === 0) return []
  
  return chartData.value.map((item, index) => {
    const x = (index / (chartData.value.length - 1)) * 580 + 10
    const y = 160 - ((item.count || 0) / maxCount.value) * 140
    return { x, y }
  })
})

// Line path for SVG
const linePath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  
  if (chartPoints.value.length === 1) {
    const point = chartPoints.value[0]
    return `M ${point?.x || 0},${point?.y || 0}`
  }
  
  const firstPoint = chartPoints.value[0]
  let path = `M ${firstPoint?.x || 0},${firstPoint?.y || 0}`
  for (let i = 1; i < chartPoints.value.length; i++) {
    const point = chartPoints.value[i]
    path += ` L ${point?.x || 0},${point?.y || 0}`
  }
  return path
})

const clearFilters = () => {
  searchTerm.value = ''
  selectedCustomer.value = []
  selectedSite.value = []
  selectedRoom.value = []
  selectedCage.value = []
  selectedItemType.value = []
  selectedDataType.value = []
  selectedSummaryDatatype.value = []
  selectedThermalDatatype.value = []
  selectedPowerDatatype.value = []
  selectedCapacityDatatype.value = []
  selectedCoolingDatatype.value = []
  selectedDataResolution.value = []
  sortBy.value = 'name'
  sortOrder.value = 'asc'
}

// Dropdown functionality
const toggleDropdown = (dropdown: string) => {
  // Close all other dropdowns
  Object.keys(dropdownOpen.value).forEach(key => {
    if (key !== dropdown) {
      dropdownOpen.value[key as keyof typeof dropdownOpen.value] = false
    }
  })
  // Toggle current dropdown
  dropdownOpen.value[dropdown as keyof typeof dropdownOpen.value] = !dropdownOpen.value[dropdown as keyof typeof dropdownOpen.value]
}

const getDropdownLabel = (type: string, selected: string[], allOptions: string[]) => {
  if (selected.length === 0) {
    return `All ${type.charAt(0).toUpperCase() + type.slice(1)}s`
  } else if (selected.length === allOptions.length) {
    return `All ${type.charAt(0).toUpperCase() + type.slice(1)}s`
  } else if (selected.length === 1) {
    return selected[0]
  } else {
    return `${selected.length} selected`
  }
}

const updateFilter = () => {
  // This method is called when checkboxes change
  // The reactive filtering will automatically update
}

// Export functionality
const toggleExportDropdown = () => {
  exportDropdownOpen.value = !exportDropdownOpen.value
}

const getCurrentTableData = () => {
  switch (activeTab.value) {
    case 'thermal':
      return thermalData.value
    case 'power':
      return powerData.value
    case 'capacity':
      return capacityData.value
    default:
      return []
  }
}

const exportToCSV = () => {
  const data = getCurrentTableData()
  if (data.length === 0) return
  
  const firstRow = data[0]
  if (!firstRow) return
  
  const headers = Object.keys(firstRow).filter(key => key !== 'id')
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${activeTab.value}_data.csv`
  link.click()
  exportDropdownOpen.value = false
}

const exportToExcel = () => {
  // For Excel export, we'll create a CSV that can be opened in Excel
  exportToCSV()
  exportDropdownOpen.value = false
}

const exportToJSON = () => {
  const data = getCurrentTableData()
  if (data.length === 0) return
  
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${activeTab.value}_data.json`
  link.click()
  exportDropdownOpen.value = false
}

const exportToPDF = () => {
  // Simple PDF export using browser print functionality
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    const data = getCurrentTableData()
    if (data.length === 0) return
    
    const firstRow = data[0]
    if (!firstRow) return
    
    const headers = Object.keys(firstRow).filter(key => key !== 'id')
    
    let html = `
      <html>
        <head>
          <title>${activeTab.value.charAt(0).toUpperCase() + activeTab.value.slice(1)} Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>${activeTab.value.charAt(0).toUpperCase() + activeTab.value.slice(1)} Data Export</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(header => `<td>${row[header as keyof typeof row]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }
  exportDropdownOpen.value = false
}

// Cage B Export functionality
const toggleExportDropdownB = () => {
  exportDropdownOpenB.value = !exportDropdownOpenB.value
}

const getCurrentTableDataB = () => {
  switch (activeTabB.value) {
    case 'thermal':
      return thermalDataB.value
    case 'power':
      return powerDataB.value
    case 'capacity':
      return capacityDataB.value
    default:
      return []
  }
}

const exportToCSVB = () => {
  const data = getCurrentTableDataB()
  if (data.length === 0) return
  
  const firstRow = data[0]
  if (!firstRow) return
  
  const headers = Object.keys(firstRow).filter(key => key !== 'id')
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row]
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `cage_b_${activeTabB.value}_data.csv`
  link.click()
  exportDropdownOpenB.value = false
}

const exportToExcelB = () => {
  // For Excel export, we'll create a CSV that can be opened in Excel
  exportToCSVB()
  exportDropdownOpenB.value = false
}

const exportToJSONB = () => {
  const data = getCurrentTableDataB()
  if (data.length === 0) return
  
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `cage_b_${activeTabB.value}_data.json`
  link.click()
  exportDropdownOpenB.value = false
}

const exportToPDFB = () => {
  // Simple PDF export using browser print functionality
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    const data = getCurrentTableDataB()
    if (data.length === 0) return
    
    const firstRow = data[0]
    if (!firstRow) return
    
    const headers = Object.keys(firstRow).filter(key => key !== 'id')
    
    let html = `
      <html>
        <head>
          <title>Cage B - ${activeTabB.value.charAt(0).toUpperCase() + activeTabB.value.slice(1)} Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Cage B - ${activeTabB.value.charAt(0).toUpperCase() + activeTabB.value.slice(1)} Data Export</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(header => `<td>${row[header as keyof typeof row]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }
  exportDropdownOpenB.value = false
}

// Chart export functionality
const toggleChartExportDropdown = () => {
  chartExportDropdownOpen.value = !chartExportDropdownOpen.value
}

const exportChartToCSV = () => {
  const data = chartData.value
  if (data.length === 0) return
  
  const headers = ['Date', selectedChartDatatype.value]
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      item.date,
      item.count
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `chart_${selectedChartDatatype.value.toLowerCase()}_data.csv`
  link.click()
  chartExportDropdownOpen.value = false
}

const exportChartToExcel = () => {
  // For Excel export, we'll create a CSV that can be opened in Excel
  exportChartToCSV()
  chartExportDropdownOpen.value = false
}

const exportChartToJSON = () => {
  const data = chartData.value
  if (data.length === 0) return
  
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `chart_${selectedChartDatatype.value.toLowerCase()}_data.json`
  link.click()
  chartExportDropdownOpen.value = false
}

const exportChartToPDF = () => {
  // Simple PDF export using browser print functionality
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    const data = chartData.value
    if (data.length === 0) return
    
    let html = `
      <html>
        <head>
          <title>Chart Data Export - ${selectedChartDatatype.value}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Chart Data Export - ${selectedChartDatatype.value}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>${selectedChartDatatype.value}</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.date}</td>
                  <td>${item.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }
  chartExportDropdownOpen.value = false
}

// Click outside to close dropdowns
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-checkbox') && !target.closest('.export-dropdown')) {
    // Close all dropdowns
    Object.keys(dropdownOpen.value).forEach(key => {
      dropdownOpen.value[key as keyof typeof dropdownOpen.value] = false
    })
    exportDropdownOpen.value = false
    chartExportDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})


const getThermalStatusClass = (status: string) => {
  return {
    'status-optimal': status === 'optimal',
    'status-good': status === 'good',
    'status-warning': status === 'warning',
    'status-critical': status === 'critical'
  }
}

const getPowerStatusClass = (status: string) => {
  return {
    'status-good': status === 'good',
    'status-warning': status === 'warning',
    'status-maintenance': status === 'maintenance',
    'status-inactive': status === 'inactive'
  }
}

const getCapacityStatusClass = (status: string) => {
  return {
    'status-good': status === 'good',
    'status-warning': status === 'warning',
    'status-critical': status === 'critical'
  }
}
</script>

<template>
  <div class="dashboard">
    <!-- Top Header -->
    <header class="top-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="header-title">Custom Rack Report</h1>
          <div class="header-info">
            <span class="header-date">{{ new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) }}</span>
            <span class="header-time">{{ new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) }}</span>
          </div>
        </div>
        
        <!-- Statistics in Header -->
        <div class="header-stats">
          <div class="header-stat">
            <span class="header-stat-label">Average Temperature</span>
            <span class="header-stat-value">{{ averageTemperature }}°C</span>
          </div>
          <div class="header-stat">
            <span class="header-stat-label">Max Temperature</span>
            <span class="header-stat-value">{{ maxTemperature }}°C</span>
            <span class="header-stat-rack">{{ maxTempRack?.rackLabel || 'N/A' }}</span>
          </div>
          <div class="header-stat">
            <span class="header-stat-label">Min Temperature</span>
            <span class="header-stat-value">{{ minTempRack?.minTemp || '0.0' }}°C</span>
            <span class="header-stat-rack">{{ minTempRack?.rackLabel || 'N/A' }}</span>
          </div>
          <div class="header-stat">
            <span class="header-stat-label">Max Power</span>
            <span class="header-stat-value">{{ powerStats.peak.toFixed(1) }}kW</span>
          </div>
          <div class="header-stat">
            <span class="header-stat-label">Avg Power</span>
            <span class="header-stat-value">{{ powerStats.average.toFixed(1) }}kW</span>
          </div>
          <div class="header-stat">
            <span class="header-stat-label">Average RH</span>
            <span class="header-stat-value">50%</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Dashboard Content -->
    <div class="dashboard-content">
      <!-- Left Sidebar Header -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1>Custom Report & Dashboard</h1>
          <p class="sidebar-subtitle">Monitor rack group performance by cage</p>
        </div>
        
        <!-- Filters in Sidebar -->
        <div class="sidebar-filters">
          <div class="filter-group">
            <label for="search">Search by Custom Reference</label>
            <input
              id="search"
              v-model="searchTerm"
              type="text"
              placeholder="Search by custom reference..."
              class="filter-input"
            />
          </div>
          
          <div class="filter-group">
            <label>Customer</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('customer')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.customer }"
              >
                {{ getDropdownLabel('customer', selectedCustomer, ['Acme Corp', 'Tech Solutions', 'Data Systems', 'Cloud Services']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.customer" class="dropdown-content">
                <label v-for="option in ['Acme Corp', 'Tech Solutions', 'Data Systems', 'Cloud Services']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedCustomer"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Site</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('site')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.site }"
              >
                {{ getDropdownLabel('site', selectedSite, ['Data Center 1', 'Data Center 2', 'Data Center 3', 'Remote Site']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.site" class="dropdown-content">
                <label v-for="option in ['Data Center 1', 'Data Center 2', 'Data Center 3', 'Remote Site']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedSite"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Room</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('room')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.room }"
              >
                {{ getDropdownLabel('room', selectedRoom, ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6', 'Floor 7']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.room" class="dropdown-content">
                <label v-for="option in ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6', 'Floor 7']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedRoom"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Cage/Rack Group</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('cage')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.cage }"
              >
                {{ getDropdownLabel('cage', selectedCage, ['Cage A', 'Cage B', 'Cage C', 'Rack Group 1', 'Rack Group 2']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.cage" class="dropdown-content">
                <label v-for="option in ['Cage A', 'Cage B', 'Cage C', 'Rack Group 1', 'Rack Group 2']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedCage"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Item Type</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('itemType')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.itemType }"
              >
                {{ getDropdownLabel('itemType', selectedItemType, ['rack', 'ambient orb', 'cooling', 'power']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.itemType" class="dropdown-content">
                <label v-for="option in ['rack', 'ambient orb', 'cooling', 'power']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedItemType"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          
          <div class="filter-group">
            <label>Summary Datatype (up to 5)</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('summaryDatatype')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.summaryDatatype }"
              >
                {{ getDropdownLabel('summaryDatatype', selectedSummaryDatatype, ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.summaryDatatype" class="dropdown-content">
                <label v-for="option in ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedSummaryDatatype"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Thermal Datatype (up to 5)</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('thermalDatatype')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.thermalDatatype }"
              >
                {{ getDropdownLabel('thermalDatatype', selectedThermalDatatype, ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.thermalDatatype" class="dropdown-content">
                <label v-for="option in ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedThermalDatatype"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Power Datatype (up to 5)</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('powerDatatype')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.powerDatatype }"
              >
                {{ getDropdownLabel('powerDatatype', selectedPowerDatatype, ['PUE', 'Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.powerDatatype" class="dropdown-content">
                <label v-for="option in ['PUE', 'Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedPowerDatatype"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Capacity Datatype (up to 5)</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('capacityDatatype')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.capacityDatatype }"
              >
                {{ getDropdownLabel('capacityDatatype', selectedCapacityDatatype, ['Max Power', 'Measured', 'Allocated', 'Reserved', 'Space']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.capacityDatatype" class="dropdown-content">
                <label v-for="option in ['Max Power', 'Measured', 'Allocated', 'Reserved', 'Space']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedCapacityDatatype"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Cooling Datatype (up to 5)</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('coolingDatatype')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.coolingDatatype }"
              >
                {{ getDropdownLabel('coolingDatatype', selectedCoolingDatatype, ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.coolingDatatype" class="dropdown-content">
                <label v-for="option in ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedCoolingDatatype"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="filter-group">
            <label>Data Resolution</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('dataResolution')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.dataResolution }"
              >
                {{ getDropdownLabel('dataResolution', selectedDataResolution, ['1 minute', '5 minutes', '15 minutes', '1 hour', '1 day']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.dataResolution" class="dropdown-content">
                <label v-for="option in ['1 minute', '5 minutes', '15 minutes', '1 hour', '1 day','1 month','1 Quarter']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedDataResolution"
                    @change="updateFilter"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <button @click="clearFilters" class="clear-filters-btn">
            Search
          </button>
        </div>
        
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Cage/rack Group Header -->
        <div class="cage-group-header">
          <h2 class="cage-group-title">Cage A - Rack Group 01-06</h2>
          <p class="cage-group-subtitle">Monitoring dashboard for racks A01 through F06 in Cage A</p>
        </div>
        
        <!-- Chart and Stats Section -->
        <div class="chart-stats-section">
          <!-- Chart Section -->
          <div class="chart-section">
            <div class="chart-header">
              <h2 class="chart-title">{{ chartTitle }}</h2>
              <div class="chart-dropdown">
                <label class="chart-dropdown-label">View Data:</label>
                <select v-model="selectedChartDatatype" class="chart-select">
                  <option 
                    v-for="datatype in availableChartDatatypes" 
                    :key="datatype" 
                    :value="datatype"
                  >
                    {{ datatype }}
                  </option>
                </select>
              </div>
            </div>
            <div class="chart-container">
              <svg class="line-chart" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                <!-- Grid lines -->
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" stroke-width="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                <!-- Line path -->
                <path 
                  v-if="chartData.length > 0"
                  :d="linePath" 
                  fill="none" 
                  stroke="url(#lineGradient)" 
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                
                <!-- Gradient definition -->
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
                  </linearGradient>
                </defs>
                
                <!-- Data points -->
                <circle 
                  v-for="(point, index) in chartPoints" 
                  :key="index"
                  :cx="point.x" 
                  :cy="point.y" 
                  r="4" 
                  fill="#667eea"
                  stroke="white"
                  stroke-width="2"
                  class="data-point"
                />
                
                <!-- Value labels -->
                <text 
                  v-for="(point, index) in chartPoints" 
                  :key="`label-${index}`"
                  :x="point.x" 
                  :y="point.y - 10" 
                  text-anchor="middle" 
                  class="value-label"
                >
                  {{ chartData[index]?.count || 0 }}{{ getChartUnit(selectedChartDatatype) }}
                </text>
                
                <!-- Date labels -->
                <text 
                  v-for="(item, index) in chartData" 
                  :key="`date-${index}`"
                  :x="(index / (chartData.length - 1)) * 580 + 10" 
                  y="190" 
                  text-anchor="middle" 
                  class="date-label"
                >
                  {{ item.displayDate }}
                </text>
                
                <!-- Y-axis label -->
                <text x="10" y="20" class="y-axis-label">{{ selectedChartDatatype }} ({{ getChartUnit(selectedChartDatatype) }})</text>
              </svg>
            </div>
            <div v-if="chartData.length === 0" class="chart-no-data">
              <p>No data available for the selected filters</p>
            </div>
            
            <!-- Chart Export Options -->
            <div class="chart-export-section">
              <div class="export-dropdown">
                <button 
                  @click="toggleChartExportDropdown" 
                  class="chart-export-button"
                  :class="{ 'active': chartExportDropdownOpen }"
                >
                  <span class="export-icon">📊</span>
                  Export Chart
                  <span class="export-arrow">▼</span>
                </button>
                <div v-if="chartExportDropdownOpen" class="export-menu">
                  <button @click="exportChartToCSV" class="export-option">
                    <span class="export-option-icon">📄</span>
                    Export to CSV
                  </button>
                  <button @click="exportChartToExcel" class="export-option">
                    <span class="export-option-icon">📊</span>
                    Export to Excel
                  </button>
                  <button @click="exportChartToJSON" class="export-option">
                    <span class="export-option-icon">🔧</span>
                    Export to JSON
                  </button>
                  <button @click="exportChartToPDF" class="export-option">
                    <span class="export-option-icon">📋</span>
                    Export to PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary Stats Table -->
          <div class="stats-table-section">
            <h3 class="stats-table-title">Cage Performance Summary</h3>
            <div class="stats-table-container">
              <table class="stats-table">
                <tbody>
                  <tr>
                    <td class="stat-label">Average Temperature</td>
                    <td class="stat-value">{{ averageTemperature }}°C</td>
                  </tr>
                  <tr>
                    <td class="stat-label">Max Temperature</td>
                    <td class="stat-value">{{ maxTemperature }}°C</td>
                  </tr>
                  <tr>
                    <td class="stat-label">Min Temperature</td>
                    <td class="stat-value">{{ minTempRack?.minTemp || '0.0' }}°C</td>
                  </tr>
                  <tr>
                    <td class="stat-label">Max Group Power</td>
                    <td class="stat-value">{{ powerStats.peak.toFixed(1) }}kW</td>
                  </tr>
                  <tr>
                    <td class="stat-label">Avg Group Power</td>
                    <td class="stat-value">{{ powerStats.average.toFixed(1) }}kW</td>
                  </tr>
                  <tr>
                    <td class="stat-label">Average RH</td>
                    <td class="stat-value">50%</td>
                  </tr>
                  <tr>
                    <td class="stat-label">Number of Racks</td>
                    <td class="stat-value">{{ powerStats.rackCount }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>


    <!-- Tabbed Data Tables -->
    <div class="tabbed-tables-container">
      <!-- Tabs -->
      <div class="tabs-container">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
      
      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Thermal Tab -->
        <div v-if="activeTab === 'thermal'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Rack Label</th>
                  <th>Grid</th>
                  <th>Temperature Range</th>
                  <th>Avg Temp</th>
                  <th>Humidity</th>
                  <th>Outlet T</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="thermal in thermalData" :key="thermal.id" class="data-row">
                  <td class="name-cell">{{ thermal.rackLabel }}</td>
                  <td class="name-cell">{{ thermal.grid }}</td>
                  <td class="value-cell">
                    <div class="temp-range">
                      <span class="temp-min">{{ thermal.minTemp }}°C</span>
                      <span class="temp-separator">-</span>
                      <span class="temp-max">{{ thermal.maxTemp }}°C</span>
                    </div>
                  </td>
                  <td class="value-cell">{{ thermal.avgTemp }}°C</td>
                  <td class="value-cell">{{ thermal.humidity }}%</td>
                  <td class="value-cell">{{ thermal.outletT }}°C</td>
                  <td class="status-cell">
                    <span :class="getThermalStatusClass(thermal.status)" class="status-badge">
                      {{ thermal.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Power Tab -->
        <div v-if="activeTab === 'power'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Circuit</th>
                  <th>Voltage</th>
                  <th>Current</th>
                  <th>Power</th>
                  <th>Load</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="power in powerData" :key="power.id" class="data-row">
                  <td class="name-cell">{{ power.circuit }}</td>
                  <td class="value-cell">{{ power.voltage }}V</td>
                  <td class="value-cell">{{ power.current }}A</td>
                  <td class="value-cell">{{ power.power }}kW</td>
                  <td class="value-cell">{{ power.load }}%</td>
                  <td class="status-cell">
                    <span :class="getPowerStatusClass(power.status)" class="status-badge">
                      {{ power.status }}
                    </span>
                  </td>
                </tr>
                <!-- Statistics Rows -->
                <tr class="stats-row">
                  <td class="stats-label">Min</td>
                  <td class="stats-value">{{ powerStatsDetailed.voltage.min }}V</td>
                  <td class="stats-value">{{ powerStatsDetailed.current.min }}A</td>
                  <td class="stats-value">{{ powerStatsDetailed.power.min }}kW</td>
                  <td class="stats-value">{{ powerStatsDetailed.load.min }}%</td>
                  <td class="stats-cell">-</td>
                </tr>
                <tr class="stats-row">
                  <td class="stats-label">Max</td>
                  <td class="stats-value">{{ powerStatsDetailed.voltage.max }}V</td>
                  <td class="stats-value">{{ powerStatsDetailed.current.max }}A</td>
                  <td class="stats-value">{{ powerStatsDetailed.power.max }}kW</td>
                  <td class="stats-value">{{ powerStatsDetailed.load.max }}%</td>
                  <td class="stats-cell">-</td>
                </tr>
                <tr class="stats-row avg-row">
                  <td class="stats-label">Average</td>
                  <td class="stats-value">{{ powerStatsDetailed.voltage.avg }}V</td>
                  <td class="stats-value">{{ powerStatsDetailed.current.avg }}A</td>
                  <td class="stats-value">{{ powerStatsDetailed.power.avg }}kW</td>
                  <td class="stats-value">{{ powerStatsDetailed.load.avg }}%</td>
                  <td class="stats-cell">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Capacity Tab -->
        <div v-if="activeTab === 'capacity'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Max Power</th>
                  <th>Measured</th>
                  <th>Allocated</th>
                  <th>Reserved</th>
                  <th>Space</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="capacity in capacityData" :key="capacity.id" class="data-row">
                  <td class="name-cell">{{ capacity.resource }}</td>
                  <td class="value-cell">{{ capacity.total }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.total - capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.utilization }}%</td>
                  <td class="status-cell">
                    <span :class="getCapacityStatusClass(capacity.status)" class="status-badge">
                      {{ capacity.status }}
                    </span>
                  </td>
                </tr>
                <!-- Statistics Rows -->
                <tr class="stats-row">
                  <td class="stats-label">Min</td>
                  <td class="stats-value">{{ capacityStats.used.min }} avg</td>
                  <td class="stats-value">{{ capacityStats.total.min }} avg</td>
                  <td class="stats-value">{{ capacityStats.utilization.min }}%</td>
                  <td class="stats-cell">-</td>
                </tr>
                <tr class="stats-row">
                  <td class="stats-label">Max</td>
                  <td class="stats-value">{{ capacityStats.used.max }} avg</td>
                  <td class="stats-value">{{ capacityStats.total.max }} avg</td>
                  <td class="stats-value">{{ capacityStats.utilization.max }}%</td>
                  <td class="stats-cell">-</td>
                </tr>
                <tr class="stats-row avg-row">
                  <td class="stats-label">Average</td>
                  <td class="stats-value">{{ capacityStats.used.avg }} avg</td>
                  <td class="stats-value">{{ capacityStats.total.avg }} avg</td>
                  <td class="stats-value">{{ capacityStats.utilization.avg }}%</td>
                  <td class="stats-cell">-</td>
                </tr>
              </tbody>
            </table>
          </div>
            </div>
          </div>
        </div>

    <!-- Export Options -->
    <div class="export-section">
      <div class="export-dropdown">
        <button 
          @click="toggleExportDropdown" 
          class="export-button"
          :class="{ 'active': exportDropdownOpen }"
        >
          <span class="export-icon">📊</span>
          Export Data
          <span class="export-arrow">▼</span>
        </button>
        <div v-if="exportDropdownOpen" class="export-menu">
          <button @click="exportToCSV" class="export-option">
            <span class="export-option-icon">📄</span>
            Export to CSV
          </button>
          <button @click="exportToExcel" class="export-option">
            <span class="export-option-icon">📊</span>
            Export to Excel
          </button>
          <button @click="exportToJSON" class="export-option">
            <span class="export-option-icon">🔧</span>
            Export to JSON
          </button>
          <button @click="exportToPDF" class="export-option">
            <span class="export-option-icon">📋</span>
            Export to PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Cage B Section -->
    <div class="cage-group-header">
      <h2 class="cage-group-title">Cage B - Rack Group G01-L06</h2>
      <p class="cage-group-subtitle">Monitoring dashboard for racks G01 through L06 in Cage B</p>
    </div>
    
    <!-- Cage B Chart and Stats Section -->
    <div class="chart-stats-section">
      <!-- Cage B Chart Section -->
      <div class="chart-section">
        <div class="chart-header">
          <h2 class="chart-title">Cage B Performance Overview</h2>
          <div class="chart-dropdown">
            <label class="chart-dropdown-label">View Data:</label>
            <select v-model="selectedChartDatatype" class="chart-select">
              <option value="Temperature">Temperature</option>
              <option value="Humidity">Humidity</option>
              <option value="Power">Power</option>
              <option value="Load">Load</option>
            </select>
          </div>
        </div>
        <div class="chart-container">
          <svg class="line-chart" viewBox="0 0 600 180" xmlns="http://www.w3.org/2000/svg">
            <!-- Grid lines -->
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.2)" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            <!-- Chart line -->
            <path 
              :d="linePath" 
              fill="none" 
              stroke="url(#lineGradient)" 
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            
            <!-- Data points -->
            <circle 
              v-for="(point, index) in chartPoints" 
              :key="index"
              :cx="point.x" 
              :cy="point.y" 
              r="4" 
              fill="#06b6d4"
              stroke="#ffffff"
              stroke-width="2"
              class="chart-point"
            />
            
            <!-- Gradient definition -->
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <!-- Cage B Summary Stats Table -->
      <div class="stats-table-section">
        <h3 class="stats-table-title">Cage B Performance Summary</h3>
        <div class="stats-table-container">
          <table class="stats-table">
            <tbody>
              <tr>
                <td class="stat-label">Avg Power per Cage</td>
                <td class="stat-value">{{ powerStatsB.average.toFixed(1) }}kW</td>
              </tr>
              <tr>
                <td class="stat-label">Peak Power</td>
                <td class="stat-value">{{ powerStatsB.peak.toFixed(1) }}kW</td>
              </tr>
              <tr>
                <td class="stat-label">Min Power</td>
                <td class="stat-value">{{ powerStatsB.min.toFixed(1) }}kW</td>
              </tr>
              <tr>
                <td class="stat-label">Total Energy</td>
                <td class="stat-value">{{ powerStatsB.totalEnergy.toFixed(1) }}kWh</td>
              </tr>
              <tr>
                <td class="stat-label">Power Efficiency</td>
                <td class="stat-value">{{ powerStatsB.efficiency }}%</td>
              </tr>
              <tr>
                <td class="stat-label">Total Racks</td>
                <td class="stat-value">{{ powerStatsB.rackCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Cage B Tabbed Tables Container -->
    <div class="tabbed-tables-container">
      <div class="tabs-container">
        <button 
          @click="activeTabB = 'thermal'" 
          :class="['tab-button', { 'active': activeTabB === 'thermal' }]"
        >
          Thermal
        </button>
        <button 
          @click="activeTabB = 'power'" 
          :class="['tab-button', { 'active': activeTabB === 'power' }]"
        >
          Power
        </button>
        <button 
          @click="activeTabB = 'capacity'" 
          :class="['tab-button', { 'active': activeTabB === 'capacity' }]"
        >
          Capacity
        </button>
        <button 
          @click="activeTabB = 'cooling'" 
          :class="['tab-button', { 'active': activeTabB === 'cooling' }]"
        >
          Cooling
        </button>
      </div>
      
      <div class="tab-content">
        <!-- Cage B Thermal Tab -->
        <div v-if="activeTabB === 'thermal'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Rack Label</th>
                  <th>Grid</th>
                  <th>Temperature Range</th>
                  <th>Avg Temp</th>
                  <th>Humidity</th>
                  <th>Outlet T</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="thermal in thermalDataB" :key="thermal.id" class="data-row">
                  <td class="name-cell">{{ thermal.rackLabel }}</td>
                  <td class="name-cell">{{ thermal.grid }}</td>
                  <td class="value-cell">
                    <div class="temp-range">
                      <span class="temp-min">{{ thermal.minTemp }}°C</span>
                      <span class="temp-separator">-</span>
                      <span class="temp-max">{{ thermal.maxTemp }}°C</span>
                    </div>
                  </td>
                  <td class="value-cell">{{ thermal.avgTemp }}°C</td>
                  <td class="value-cell">{{ thermal.humidity }}%</td>
                  <td class="value-cell">{{ thermal.outletT }}°C</td>
                  <td class="status-cell">
                    <span :class="getThermalStatusClass(thermal.status)" class="status-badge">
                      {{ thermal.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Cage B Power Tab -->
        <div v-if="activeTabB === 'power'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Circuit</th>
                  <th>Voltage</th>
                  <th>Current</th>
                  <th>Power</th>
                  <th>Load</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="power in powerDataB" :key="power.id" class="data-row">
                  <td class="name-cell">{{ power.circuit }}</td>
                  <td class="value-cell">{{ power.voltage }}V</td>
                  <td class="value-cell">{{ power.current }}A</td>
                  <td class="value-cell">{{ power.power }}kW</td>
                  <td class="value-cell">{{ power.load }}%</td>
                  <td class="status-cell">
                    <span :class="getPowerStatusClass(power.status)" class="status-badge">
                      {{ power.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Cage B Capacity Tab -->
        <div v-if="activeTabB === 'capacity'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Max Power</th>
                  <th>Measured</th>
                  <th>Allocated</th>
                  <th>Reserved</th>
                  <th>Space</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="capacity in capacityDataB" :key="capacity.id" class="data-row">
                  <td class="name-cell">{{ capacity.resource }}</td>
                  <td class="value-cell">{{ capacity.total }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.total - capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.utilization }}%</td>
                  <td class="status-cell">
                    <span :class="getCapacityStatusClass(capacity.status)" class="status-badge">
                      {{ capacity.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Cage B Cooling Tab -->
        <div v-if="activeTabB === 'cooling'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Used</th>
                  <th>Total</th>
                  <th>Unit</th>
                  <th>Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="capacity in capacityDataB" :key="capacity.id" class="data-row">
                  <td class="name-cell">{{ capacity.resource }}</td>
                  <td class="value-cell">{{ capacity.used }}</td>
                  <td class="value-cell">{{ capacity.total }}</td>
                  <td class="value-cell">{{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.utilization }}%</td>
                  <td class="status-cell">
                    <span :class="getCapacityStatusClass(capacity.status)" class="status-badge">
                      {{ capacity.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
      </div>
    </div>
      </div>
    </div>

    <!-- Cage B Export Options -->
    <div class="export-section">
      <div class="export-dropdown">
        <button 
          @click="toggleExportDropdownB" 
          class="export-button"
          :class="{ 'active': exportDropdownOpenB }"
        >
          <span class="export-icon">📊</span>
          Export Cage B Data
          <span class="export-arrow">▼</span>
        </button>
        <div v-if="exportDropdownOpenB" class="export-menu">
          <button @click="exportToCSVB" class="export-option">
            <span class="export-option-icon">📄</span>
            Export to CSV
          </button>
          <button @click="exportToExcelB" class="export-option">
            <span class="export-option-icon">📊</span>
            Export to Excel
          </button>
          <button @click="exportToJSONB" class="export-option">
            <span class="export-option-icon">🔧</span>
            Export to JSON
          </button>
          <button @click="exportToPDFB" class="export-option">
            <span class="export-option-icon">📋</span>
            Export to PDF
          </button>
        </div>
      </div>
    </div>

    </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 25%, #1e293b 50%, #0f172a 75%, #020817 100%);
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
}

.dashboard::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.top-header {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  padding: 1.5rem 2rem;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), 
              0 1px 0 rgba(255, 255, 255, 0.05) inset,
              0 -1px 0 rgba(0, 0, 0, 0.1) inset;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  gap: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-title {
  margin: 0;
  color: #f8fafc;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.header-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.header-date {
  color: #cbd5e1;
  font-size: 0.875rem;
  font-weight: 500;
}

.header-time {
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 400;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.header-stat {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 50%, rgba(71, 85, 105, 0.7) 100%);
  color: #f8fafc;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  text-align: center;
  min-width: 90px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4),
              0 1px 0 rgba(255, 255, 255, 0.1) inset,
              0 -1px 0 rgba(0, 0, 0, 0.2) inset;
  border: 1px solid rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.header-stat::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.header-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5),
              0 1px 0 rgba(255, 255, 255, 0.15) inset;
  border-color: rgba(59, 130, 246, 0.5);
}

.header-stat:hover::before {
  left: 100%;
}

.header-stat-label {
  display: block;
  font-size: 0.7rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
}

.header-stat-rack {
  display: block;
  font-size: 0.7rem;
  opacity: 0.8;
  margin-top: 0.25rem;
  color: #cbd5e1;
  font-weight: 500;
}

.dashboard-content {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 320px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  padding: 2rem;
  box-shadow: 8px 0 50px rgba(0, 0, 0, 0.4),
              1px 0 0 rgba(255, 255, 255, 0.05) inset,
              -1px 0 0 rgba(0, 0, 0, 0.1) inset;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  border-right: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  z-index: 10;
}

.sidebar-header h1 {
  margin: 0 0 0.5rem 0;
  color: #f8fafc;
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.sidebar-subtitle {
  margin: 0;
  color: #94a3b8;
  font-size: 0.875rem;
  font-weight: 400;
}

.sidebar-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.sidebar-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-stat {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.sidebar-stat-label {
  display: block;
  font-size: 0.75rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.cage-group-header {
  margin-bottom: 2rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.cage-group-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

.cage-group-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cage-group-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #94a3b8;
  opacity: 0.9;
  font-weight: 400;
  line-height: 1.5;
}

.chart-stats-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-section {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
              0 1px 0 rgba(255, 255, 255, 0.05) inset,
              0 -1px 0 rgba(0, 0, 0, 0.1) inset;
  border: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  overflow: hidden;
}

.chart-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
}

.stats-table-section {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
              0 1px 0 rgba(255, 255, 255, 0.05) inset,
              0 -1px 0 rgba(0, 0, 0, 0.1) inset;
  border: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  overflow: hidden;
}

.stats-table-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
}

.stats-table-title {
  margin: 0 0 1.5rem 0;
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 600;
}

.stats-table-container {
  overflow: hidden;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table tr {
  border-bottom: 1px solid #e2e8f0;
}

.stats-table tr:last-child {
  border-bottom: none;
}

.stats-table td {
  padding: 0.75rem 0;
  font-size: 0.875rem;
}

.stat-label {
  color: #cbd5e1;
  font-weight: 500;
  text-align: left;
}

.stat-value {
  color: #f8fafc;
  font-weight: 600;
  text-align: right;
}

.tabbed-tables-container {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4),
              0 1px 0 rgba(255, 255, 255, 0.05) inset,
              0 -1px 0 rgba(0, 0, 0, 0.1) inset;
  border: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
}

.tabbed-tables-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
  z-index: 1;
}

.tabs-container {
  display: flex;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;
}

.tab-button {
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.5s ease;
}

.tab-button:hover {
  color: #f8fafc;
  background: rgba(30, 41, 59, 0.4);
  transform: translateY(-1px);
}

.tab-button:hover::before {
  left: 100%;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 41, 59, 0.6) 100%);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.tab-icon {
  font-size: 1rem;
}

.tab-label {
  font-weight: 600;
}

.tab-content {
  min-height: 400px;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chart-export-section {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.chart-export-button {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.9) 50%, rgba(71, 85, 105, 0.85) 100%);
  color: #f8fafc;
  border: 2px solid rgba(59, 130, 246, 0.4);
  border-radius: 12px;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2),
              0 1px 0 rgba(255, 255, 255, 0.1) inset;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.chart-export-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.chart-export-button:hover {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.95) 0%, rgba(71, 85, 105, 0.9) 100%);
  border-color: rgba(59, 130, 246, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3),
              0 1px 0 rgba(255, 255, 255, 0.15) inset;
}

.chart-export-button:hover::before {
  left: 100%;
}

.chart-export-button.active {
  border-color: rgba(59, 130, 246, 0.8);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 41, 59, 0.95) 100%);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 8px 25px rgba(0, 0, 0, 0.3);
}

.chart-title {
  margin: 0;
  color: #f8fafc;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  flex: 1;
}

.chart-dropdown {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chart-dropdown-label {
  color: #cbd5e1;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.chart-select {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 100%);
  color: #f8fafc;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  min-width: 120px;
}

.chart-select:hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.9) 0%, rgba(71, 85, 105, 0.8) 100%);
}

.chart-select:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 6px 20px rgba(0, 0, 0, 0.3);
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
}

.line-chart {
  width: 100%;
  height: 100%;
  max-width: 600px;
}

.data-point {
  transition: all 0.2s ease;
  cursor: pointer;
}

.data-point:hover {
  r: 6;
  fill: #764ba2;
}

.value-label {
  font-size: 0.75rem;
  font-weight: 600;
  fill: #2d3748;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.date-label {
  font-size: 0.7rem;
  font-weight: 500;
  fill: #4a5568;
}

.y-axis-label {
  font-size: 0.8rem;
  font-weight: 600;
  fill: #2d3748;
  text-anchor: start;
}

.chart-no-data {
  text-align: center;
  padding: 2rem;
  color: #718096;
  font-style: italic;
}



.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.filter-input,
.filter-select {
  padding: 0.75rem;
  border: 2px solid #475569;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: #1e293b;
  color: #f8fafc;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Dropdown checkbox styling */
.dropdown-checkbox {
  position: relative;
  width: 100%;
}

.dropdown-button {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid rgba(71, 85, 105, 0.6);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 100%);
  color: #f8fafc;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  text-align: left;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dropdown-button:hover {
  border-color: rgba(59, 130, 246, 0.6);
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.9) 0%, rgba(71, 85, 105, 0.8) 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.dropdown-button.active {
  border-color: rgba(59, 130, 246, 0.8);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 41, 59, 0.9) 100%);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 8px 25px rgba(0, 0, 0, 0.3);
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  font-size: 0.75rem;
  color: #94a3b8;
}

.dropdown-button.active .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4),
              0 1px 0 rgba(255, 255, 255, 0.05) inset;
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  backdrop-filter: blur(20px) saturate(180%);
}

.checkbox-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #334155;
}

.checkbox-item:last-child {
  border-bottom: none;
}

.checkbox-item:hover {
  background: #334155;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 0.75rem;
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.checkbox-label {
  color: #f8fafc;
  font-size: 0.875rem;
  cursor: pointer;
  flex: 1;
}

/* Scrollbar styling for dropdown */
.dropdown-content::-webkit-scrollbar {
  width: 6px;
}

.dropdown-content::-webkit-scrollbar-track {
  background: #334155;
}

.dropdown-content::-webkit-scrollbar-thumb {
  background: #64748b;
  border-radius: 3px;
}

.dropdown-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Export section styling */
.export-section {
  margin-top: 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: flex-end;
}

.export-dropdown {
  position: relative;
}

.export-button {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.9) 50%, rgba(71, 85, 105, 0.85) 100%);
  color: #f8fafc;
  border: 2px solid rgba(59, 130, 246, 0.4);
  border-radius: 16px;
  padding: 0.875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3),
              0 1px 0 rgba(255, 255, 255, 0.1) inset;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.export-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.export-button:hover {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.95) 0%, rgba(71, 85, 105, 0.9) 100%);
  border-color: rgba(59, 130, 246, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4),
              0 1px 0 rgba(255, 255, 255, 0.15) inset;
}

.export-button:hover::before {
  left: 100%;
}

.export-button.active {
  border-color: rgba(59, 130, 246, 0.8);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 41, 59, 0.95) 100%);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 8px 25px rgba(0, 0, 0, 0.3);
}

.export-icon {
  font-size: 1rem;
}

.export-arrow {
  transition: transform 0.3s ease;
  font-size: 0.75rem;
  color: #94a3b8;
}

.export-button.active .export-arrow {
  transform: rotate(180deg);
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #1e293b;
  border: 2px solid #475569;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.export-option {
  width: 100%;
  background: transparent;
  color: #f8fafc;
  border: none;
  padding: 1rem 1.25rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  text-align: left;
  border-bottom: 1px solid #334155;
}

.export-option:last-child {
  border-bottom: none;
}

.export-option:hover {
  background: #334155;
  color: #ffffff;
}

.export-option-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

.clear-filters-btn {
  background: linear-gradient(135deg, #1e293b, #334155);
  color: #f8fafc;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.clear-filters-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.table-container {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4),
              0 1px 0 rgba(255, 255, 255, 0.05) inset;
  border: 1px solid rgba(59, 130, 246, 0.2);
  margin: 1rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.9) 50%, rgba(71, 85, 105, 0.85) 100%);
  color: #f8fafc;
  padding: 1.25rem 1rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  position: relative;
}

.data-table th::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
  font-size: 0.875rem;
  color: #f8fafc;
  transition: all 0.2s ease;
}

.data-row {
  transition: all 0.3s ease;
}

.data-row:hover {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(51, 65, 85, 0.2) 100%);
  transform: translateX(4px);
  box-shadow: 4px 0 8px rgba(59, 130, 246, 0.1);
}

/* Statistics rows styling */
.stats-row {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 100%);
  border-top: 2px solid rgba(59, 130, 246, 0.3);
  position: relative;
}

.stats-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.6));
}

.stats-row.avg-row {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(30, 41, 59, 0.8) 100%);
  border-top: 2px solid rgba(59, 130, 246, 0.5);
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.stats-row.avg-row::before {
  background: linear-gradient(180deg, rgba(59, 130, 246, 1), rgba(139, 92, 246, 0.8));
  width: 4px;
}

.stats-label {
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-value {
  color: #3b82f6;
  font-weight: 600;
  font-size: 0.875rem;
}

.stats-cell {
  color: #94a3b8;
  font-style: italic;
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background: #c6f6d5;
  color: #22543d;
}

.status-pending {
  background: #fef5e7;
  color: #744210;
}

.status-inactive {
  background: #fed7d7;
  color: #742a2a;
}

.status-maintenance {
  background: #fef5e7;
  color: #744210;
}

.status-excellent {
  background: #c6f6d5;
  color: #22543d;
}

.status-optimal {
  background: #bee3f8;
  color: #2a4365;
}

.status-good {
  background: #fef5e7;
  color: #744210;
}

.status-warning {
  background: #fef5e7;
  color: #744210;
}

.status-critical {
  background: #fed7d7;
  color: #742a2a;
}

.priority-high {
  background: #fed7d7;
  color: #742a2a;
}

.priority-medium {
  background: #fef5e7;
  color: #744210;
}

.priority-low {
  background: #c6f6d5;
  color: #22543d;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.value-cell {
  font-weight: 600;
  color: #2d3748;
}

.name-cell {
  font-weight: 600;
  color: #2d3748;
}

.temp-range {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.temp-min {
  color: #3b82f6;
  font-weight: 500;
}

.temp-separator {
  color: #94a3b8;
  font-weight: 400;
}

.temp-max {
  color: #ef4444;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    padding: 1rem;
  }
  
  .sidebar-header h1 {
    font-size: 1.5rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .header-stat {
    min-width: 70px;
    padding: 0.5rem 0.75rem;
  }
  
  .header-stat-value {
    font-size: 0.875rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .cage-group-header {
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .cage-group-title {
    font-size: 1.5rem;
  }
  
  .cage-group-subtitle {
    font-size: 0.9rem;
  }
  
  .chart-stats-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .chart-section {
    padding: 1rem;
  }
  
  .stats-table-section {
    padding: 1rem;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .line-chart {
    max-width: 500px;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .tabs-container {
    flex-direction: column;
  }
  
  .tab-button {
    justify-content: flex-start;
    text-align: left;
    border-bottom: none;
    border-left: 3px solid transparent;
  }
  
  .tab-button.active {
    border-bottom-color: transparent;
    border-left-color: #667eea;
  }
  
  .data-table {
    font-size: 0.75rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .header-stats {
    flex-direction: column;
    width: 100%;
  }
  
  .header-stat {
    width: 100%;
    min-width: auto;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .line-chart {
    max-width: 400px;
  }
  
  .value-label {
    font-size: 0.7rem;
  }
  
  .date-label {
    font-size: 0.65rem;
  }
}
</style>
