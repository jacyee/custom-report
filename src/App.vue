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
const itemLabel = ref('')
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
const selectedDataResolution = ref<string[]>([])
const selectedAggregation = ref<Record<string, string[]>>({})
const dateRange = ref({
  start: '',
  end: ''
})
const sortBy = ref('name')
const sortOrder = ref('asc')
const selectedAggregateLevel = ref('Estate Level')

// Dropdown states
const dropdownOpen = ref({
  aggregateLevel: false,
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
  dataResolution: false
})

// Export dropdown state
const exportDropdownOpen = ref(false)
const exportDropdownOpenB = ref(false)
const chartExportDropdownOpen = ref(false)

// Graph modal state
interface TimeSeriesPoint {
  time: string
  value: number
  unit: string
}

const showGraphModal = ref(false)
const selectedGraphData = ref<TimeSeriesPoint[] | null>(null)
const selectedGraphTitle = ref('')

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
    const matchesItemLabel = itemLabel.value.trim() === '' || item.name.toLowerCase().includes(itemLabel.value.toLowerCase())
    
    // Apply aggregate level filtering
    let matchesSite = true
    let matchesRoom = true
    
    if (selectedAggregateLevel.value === 'Site Level' || selectedAggregateLevel.value === 'Room Level') {
      matchesSite = selectedSite.value.length === 0 || (item.site && selectedSite.value.includes(item.site)) || false
    }
    
    if (selectedAggregateLevel.value === 'Room Level') {
      matchesRoom = selectedRoom.value.length === 0 || (item.room && selectedRoom.value.includes(item.room)) || false
    }
    
    const matchesCage = selectedCage.value.length === 0 || (item.cage && selectedCage.value.includes(item.cage))
    const matchesItemType = selectedItemType.value.length === 0 || (item.itemType && selectedItemType.value.includes(item.itemType))
    const matchesDataType = selectedDataType.value.length === 0 || (item.dataType && selectedDataType.value.includes(item.dataType))
    
    // Date range filtering
    const matchesDateRange = () => {
      if (!dateRange.value.start && !dateRange.value.end) return true
      
      const itemDate = new Date(item.date)
      const startDate = dateRange.value.start ? new Date(dateRange.value.start) : null
      const endDate = dateRange.value.end ? new Date(dateRange.value.end) : null
      
      if (startDate && endDate) {
        return itemDate >= startDate && itemDate <= endDate
      } else if (startDate) {
        return itemDate >= startDate
      } else if (endDate) {
        return itemDate <= endDate
      }
      return true
    }
    
    return matchesSearch && matchesCustomer && matchesItemLabel && matchesSite && matchesRoom && matchesCage && matchesItemType && matchesDataType && matchesDateRange()
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
  if (newSelection.length > 0) {
    // Check if current selection is still valid in availableChartDatatypes
    const available = availableChartDatatypes.value
    if (!available.includes(selectedChartDatatype.value)) {
      // Reset to first available option if current selection is not in the new list
      selectedChartDatatype.value = available[0] || 'Average Temperature'
    }
  } else {
    // Reset to Average Temperature if no selection
    selectedChartDatatype.value = 'Average Temperature'
  }
}, { deep: true })

// Watch for changes in aggregations to update chart datatype options
watch(selectedAggregation, () => {
  // Check if current selection is still valid in availableChartDatatypes
  const available = availableChartDatatypes.value
  if (!available.includes(selectedChartDatatype.value)) {
    // Reset to first available option if current selection is not in the new list
    selectedChartDatatype.value = available[0] || 'Average Temperature'
  }
}, { deep: true })

// Watch for changes in Aggregate Level selection
watch(selectedAggregateLevel, () => {
  // Clear site selection when aggregate level changes
  selectedSite.value = []
  
  // Clear room selection only when switching to Estate Level (not needed at Estate Level)
  if (selectedAggregateLevel.value === 'Estate Level') {
    selectedRoom.value = []
  }
  
  // Clear cage and itemType selections when aggregate level is Site Level or Estate Level
  if (selectedAggregateLevel.value === 'Site Level' || selectedAggregateLevel.value === 'Estate Level') {
    selectedCage.value = []
    selectedItemType.value = []
  }
  
  // Close any open dropdowns
  dropdownOpen.value.site = false
  dropdownOpen.value.room = false
  dropdownOpen.value.cage = false
  dropdownOpen.value.itemType = false
})

// Generate sample time series data
const generateTimeSeriesData = (_type: string, value: number | string, unit: string): TimeSeriesPoint[] => {
  const data: TimeSeriesPoint[] = []
  const now = new Date()
  const baseValue = typeof value === 'number' ? value : parseFloat(value.toString()) || 0
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)) // Last 24 hours
    const variation = (Math.random() - 0.5) * 0.1 * baseValue // ±5% variation
    const dataPoint = Math.max(0, baseValue + variation)
    
    data.push({
      time: timestamp.toISOString(),
      value: parseFloat(dataPoint.toFixed(2)),
      unit: unit
    })
  }
  
  return data
}

// Handle graph icon click
const showGraph = (record: any, type: string) => {
  let data: TimeSeriesPoint[] = []
  let title = ''
  
  if (type === 'thermal') {
    data = generateTimeSeriesData('temperature', record.avgTemp, '°C')
    if (selectedAggregateLevel.value === 'Estate Level') {
      title = `${record.site} - Temperature Time Series`
    } else if (selectedAggregateLevel.value === 'Site Level') {
      title = `${record.room} - Temperature Time Series`
    } else {
      title = `${record.rackLabel} - Temperature Time Series`
    }
  } else if (type === 'power') {
    if (selectedAggregateLevel.value === 'Estate Level') {
      data = generateTimeSeriesData('power', record.totalPower, 'kW')
      title = `${record.site} - Total Power Time Series`
    } else if (selectedAggregateLevel.value === 'Site Level') {
      data = generateTimeSeriesData('power', record.totalPower, 'kW')
      title = `${record.room} - Total Power Time Series`
    } else {
      data = generateTimeSeriesData('power', record.power, 'kW')
      title = `${record.rack} - Power Time Series`
    }
  } else if (type === 'capacity') {
    if (selectedAggregateLevel.value === 'Estate Level') {
      data = generateTimeSeriesData('utilization', record.utilization, '%')
      title = `${record.site} - Rack Utilization Time Series`
    } else if (selectedAggregateLevel.value === 'Site Level') {
      data = generateTimeSeriesData('utilization', record.utilization, '%')
      title = `${record.room} - Rack Utilization Time Series`
    } else {
      data = generateTimeSeriesData('utilization', record.utilization, '%')
      title = `${record.rack} - Utilization Time Series`
    }
  }
  
  selectedGraphData.value = data
  selectedGraphTitle.value = title
  showGraphModal.value = true
}

// Close graph modal
const closeGraphModal = () => {
  showGraphModal.value = false
  selectedGraphData.value = null
  selectedGraphTitle.value = ''
}




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
  // Format: datatype + aggregation (e.g., "Temperature - Max", "Power - Avg")
  const dataValues: Record<string, number[]> = {
    'Average Temperature': [22.1, 23.5, 21.8, 24.2, 23.1, 22.7, 23.8, 24.9, 23.4, 22.3, 24.1, 24.7, 23.2, 22.5, 23.6],
    'Max Temperature': [26.8, 27.5, 26.2, 28.1, 27.2, 26.9, 27.8, 28.9, 27.4, 26.3, 28.1, 28.7, 27.2, 26.5, 27.6],
    'Min Temperature': [18.1, 19.5, 17.8, 20.2, 19.1, 18.7, 19.8, 20.9, 19.4, 18.3, 20.1, 20.7, 19.2, 18.5, 19.6],
    'Max Group Power': [4.1, 4.3, 3.8, 4.5, 4.2, 3.9, 4.4, 4.8, 4.3, 3.7, 4.6, 4.9, 4.1, 3.8, 4.2],
    'Avg Group Power': [2.5, 3.2, 2.8, 4.1, 3.7, 2.9, 3.5, 4.3, 3.8, 2.7, 3.9, 4.2, 3.4, 2.6, 3.1],
    'Average RH': [42, 45, 38, 48, 44, 41, 46, 51, 43, 39, 47, 49, 42, 40, 45],
    // Dynamic datatypes with aggregations
    'Temperature - Max': [26.8, 27.5, 26.2, 28.1, 27.2, 26.9, 27.8, 28.9, 27.4, 26.3, 28.1, 28.7, 27.2, 26.5, 27.6],
    'Temperature - Min': [18.1, 19.5, 17.8, 20.2, 19.1, 18.7, 19.8, 20.9, 19.4, 18.3, 20.1, 20.7, 19.2, 18.5, 19.6],
    'Temperature - Avg': [22.1, 23.5, 21.8, 24.2, 23.1, 22.7, 23.8, 24.9, 23.4, 22.3, 24.1, 24.7, 23.2, 22.5, 23.6],
    'Power - Max': [4.1, 4.3, 3.8, 4.5, 4.2, 3.9, 4.4, 4.8, 4.3, 3.7, 4.6, 4.9, 4.1, 3.8, 4.2],
    'Power - Min': [1.2, 1.5, 1.1, 1.8, 1.4, 1.3, 1.6, 1.9, 1.5, 1.2, 1.7, 1.8, 1.4, 1.3, 1.5],
    'Power - Avg': [2.5, 3.2, 2.8, 4.1, 3.7, 2.9, 3.5, 4.3, 3.8, 2.7, 3.9, 4.2, 3.4, 2.6, 3.1],
    'Humidity - Max': [65, 68, 62, 70, 66, 64, 69, 72, 67, 63, 71, 73, 65, 64, 68],
    'Humidity - Min': [35, 38, 32, 40, 36, 34, 39, 42, 37, 33, 41, 43, 35, 34, 38],
    'Humidity - Avg': [50, 53, 47, 55, 51, 49, 54, 57, 52, 48, 56, 58, 50, 49, 53],
    'PUE - Max': [1.52, 1.55, 1.48, 1.58, 1.53, 1.50, 1.56, 1.60, 1.54, 1.49, 1.57, 1.61, 1.52, 1.50, 1.54],
    'PUE - Min': [1.15, 1.18, 1.12, 1.20, 1.16, 1.14, 1.19, 1.22, 1.17, 1.13, 1.21, 1.23, 1.15, 1.14, 1.18],
    'PUE - Avg': [1.35, 1.38, 1.32, 1.40, 1.36, 1.34, 1.39, 1.42, 1.37, 1.33, 1.41, 1.43, 1.35, 1.34, 1.38],
    'Voltage - Max': [240, 242, 238, 245, 241, 239, 243, 246, 242, 238, 244, 247, 240, 239, 242],
    'Voltage - Min': [220, 222, 218, 225, 221, 219, 223, 226, 222, 218, 224, 227, 220, 219, 222],
    'Voltage - Avg': [230, 232, 228, 235, 231, 229, 233, 236, 232, 228, 234, 237, 230, 229, 232],
    'Amps - Max': [45, 47, 43, 50, 46, 44, 48, 51, 47, 43, 49, 52, 45, 44, 47],
    'Amps - Min': [22, 24, 20, 27, 23, 21, 25, 28, 24, 20, 26, 29, 22, 21, 24],
    'Amps - Avg': [33, 35, 31, 38, 34, 32, 36, 39, 35, 31, 37, 40, 33, 32, 35],
    'Energy - Max': [98, 103, 91, 108, 100, 94, 106, 115, 101, 89, 110, 118, 98, 91, 101],
    'Energy - Min': [29, 36, 26, 43, 34, 31, 38, 46, 36, 27, 42, 50, 29, 28, 36],
    'Energy - Avg': [60, 68, 58, 75, 67, 62, 72, 80, 68, 58, 76, 84, 63, 59, 68],
    'Compliance - Max': [100, 100, 98, 100, 100, 99, 100, 100, 100, 98, 100, 100, 100, 99, 100],
    'Compliance - Min': [85, 87, 82, 90, 86, 84, 88, 92, 87, 83, 89, 93, 85, 84, 87],
    'Compliance - Avg': [92, 94, 90, 95, 93, 91, 94, 96, 93, 90, 95, 97, 92, 91, 94]
  }

  // Check if selectedChartDatatype is in the format "Datatype - Aggregation"
  let values: number[] | undefined = dataValues[selectedChartDatatype.value]
  
  // If not found, try to get from getDatatypeValue function
  if (!values) {
    // Parse the selected chart datatype (e.g., "Temperature - Max" -> datatype: "Temperature", agg: "Max")
    const match = selectedChartDatatype.value.match(/^(.+?)\s*-\s*(Max|Min|Avg)$/)
    if (match && match[1] && match[2]) {
      const datatype = match[1]
      const aggregation = match[2]
      // Generate values based on datatype and aggregation
      const baseValue = getDatatypeValue(datatype, aggregation)
      // Create time series data
      const baseNum = parseFloat(baseValue.toString().replace(/[^\d.]/g, '')) || 0
      values = baseData.map(() => baseNum + (Math.random() - 0.5) * 0.1 * baseNum)
    } else {
      values = dataValues['Average Temperature']
    }
  }
  
  // Ensure values is defined
  const finalValues = values || dataValues['Average Temperature'] || []
  
  return baseData.map((item, index) => ({
    date: item.date,
    count: finalValues[index] || 0,
    displayDate: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }))
})

const maxCount = computed(() => {
  return Math.max(...chartData.value.map(item => item.count), 1)
})

// Available chart datatypes based on Summary Datatype selections with aggregations
const availableChartDatatypes = computed(() => {
  if (selectedSummaryDatatype.value.length === 0) {
    return ['Average Temperature', 'Max Temperature', 'Min Temperature', 'Max Group Power', 'Avg Group Power', 'Average RH']
  }
  
  // Build list of datatypes with their selected aggregations
  const datatypes: string[] = []
  selectedSummaryDatatype.value.forEach(datatype => {
    const aggregations = selectedAggregation.value[datatype] || ['Avg']
    aggregations.forEach(agg => {
      // Format: "Temperature - Max", "Power - Avg", etc.
      datatypes.push(`${datatype} - ${agg}`)
    })
  })
  
  return datatypes.length > 0 ? datatypes : ['Average Temperature']
})

// Computed properties to determine which columns to show in tables
const showThermalColumns = computed(() => {
  return {
    temperature: selectedThermalDatatype.value.length === 0 || selectedThermalDatatype.value.includes('Temperature'),
    humidity: selectedThermalDatatype.value.length === 0 || selectedThermalDatatype.value.includes('Humidity'),
    outletT: selectedThermalDatatype.value.length === 0 || selectedThermalDatatype.value.includes('Outlet T'),
    compliance: selectedThermalDatatype.value.length === 0 || selectedThermalDatatype.value.includes('Compliance'),
    dewPoint: selectedThermalDatatype.value.length === 0 || selectedThermalDatatype.value.includes('Dew Point')
  }
})

const showPowerColumns = computed(() => {
  return {
    pue: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('PUE'),
    voltage: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('Voltage'),
    amps: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('Amps'),
    power: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('Power'),
    energy: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('Energy')
  }
})

const showCapacityColumns = computed(() => {
  const showAll = selectedCapacityDatatype.value.length === 0
  const hasOption = (option: string) => showAll || selectedCapacityDatatype.value.includes(option)
  const hasMaxPower = showAll || selectedCapacityDatatype.value.some(option => option === 'MAX POWER' || option === 'MAXIMUMPOWER')
  return {
    measured: hasOption('Measured'),
    allocated: hasOption('Allocated'),
    reserved: hasOption('Reserved'),
    space: hasOption('Space'),
    maxPower: hasMaxPower
  }
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
    'Average RH': '%',
    'Temperature': '°C',
    'Power': 'kW',
    'Humidity': '%',
    'PUE': '',
    'Voltage': 'V',
    'Amps': 'A',
    'Energy': 'kWh',
    'Compliance': '%',
    'Airflow': 'CFM',
    'Utilization': '%',
    'Dew Point': '°C',
    'Outlet T': '°C'
  }
  
  // Extract base datatype if format is "Datatype - Aggregation"
  const match = datatype.match(/^(.+?)\s*-\s*(Max|Min|Avg)$/)
  if (match && match[1]) {
    const baseDatatype = match[1].trim()
    return units[baseDatatype] || ''
  }
  
  return units[datatype] || ''
}

// Power statistics for the summary table
const powerStats = computed(() => {
  const powers = chartData.value.map(item => item.count)
  if (powers.length === 0) {
    return {
      average: 0,
      peak: 0,
      min: 0,
      totalEnergy: 0,
      efficiency: 0,
      rackCount: 8
    }
  }
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
  { id: 1, circuit: 'PDU-01', rack: 'RACK-A01', grid: 'A', voltage: 208, current: 15.2, power: 3.2, load: 85, pue: 1.45, status: 'good' },
  { id: 2, circuit: 'PDU-02', rack: 'RACK-B02', grid: 'B', voltage: 208, current: 13.8, power: 2.9, load: 72, pue: 1.38, status: 'good' },
  { id: 3, circuit: 'PDU-03', rack: 'RACK-C03', grid: 'C', voltage: 208, current: 2.1, power: 0.4, load: 15, pue: 1.25, status: 'maintenance' },
  { id: 4, circuit: 'PDU-04', rack: 'RACK-D04', grid: 'D', voltage: 208, current: 19.7, power: 4.1, load: 92, pue: 1.52, status: 'warning' },
  { id: 5, circuit: 'PDU-05', rack: 'RACK-E05', grid: 'E', voltage: 208, current: 17.8, power: 3.7, load: 78, pue: 1.48, status: 'good' },
  { id: 6, circuit: 'PDU-06', rack: 'RACK-F06', grid: 'F', voltage: 208, current: 14.0, power: 2.9, load: 65, pue: 1.35, status: 'good' },
  { id: 7, circuit: 'PDU-07', rack: 'RACK-A01', grid: 'A', voltage: 208, current: 16.8, power: 3.5, load: 88, pue: 1.42, status: 'good' },
  { id: 8, circuit: 'PDU-08', rack: 'RACK-B02', grid: 'B', voltage: 208, current: 1.0, power: 0.2, load: 5, pue: 1.15, status: 'inactive' }
])

// Cage B - Power data
const powerDataB = ref([
  { id: 1, circuit: 'PDU-G01', rack: 'RACK-G01', grid: 'G', voltage: 208, current: 14.8, power: 3.1, load: 83, pue: 1.43, status: 'good' },
  { id: 2, circuit: 'PDU-H02', rack: 'RACK-H02', grid: 'H', voltage: 208, current: 13.2, power: 2.7, load: 70, pue: 1.36, status: 'good' },
  { id: 3, circuit: 'PDU-I03', rack: 'RACK-I03', grid: 'I', voltage: 208, current: 2.3, power: 0.5, load: 18, pue: 1.22, status: 'maintenance' },
  { id: 4, circuit: 'PDU-J04', rack: 'RACK-J04', grid: 'J', voltage: 208, current: 18.9, power: 3.9, load: 89, pue: 1.51, status: 'warning' },
  { id: 5, circuit: 'PDU-K05', rack: 'RACK-K05', grid: 'K', voltage: 208, current: 16.5, power: 3.4, load: 75, pue: 1.46, status: 'good' },
  { id: 6, circuit: 'PDU-L06', rack: 'RACK-L06', grid: 'L', voltage: 208, current: 13.8, power: 2.9, load: 63, pue: 1.33, status: 'good' },
  { id: 7, circuit: 'PDU-M07', rack: 'RACK-G01', grid: 'G', voltage: 208, current: 15.9, power: 3.3, load: 85, pue: 1.40, status: 'good' },
  { id: 8, circuit: 'PDU-N08', rack: 'RACK-H02', grid: 'H', voltage: 208, current: 1.2, power: 0.3, load: 7, pue: 1.12, status: 'inactive' }
])

// Cage A - Capacity data
const capacityData = ref([
  { id: 1, resource: 'Rack Space', rack: 'RACK-A01', grid: 'A', used: 68, total: 80, unit: 'U', utilization: 85, status: 'good', maxPower: 80 },
  { id: 2, resource: 'Power Capacity', rack: 'RACK-B02', grid: 'B', used: 24.5, total: 40, unit: 'kW', utilization: 61, status: 'good', maxPower: 40 },
  { id: 3, resource: 'Cooling Capacity', rack: 'RACK-C03', grid: 'C', used: 85, total: 100, unit: 'tons', utilization: 85, status: 'warning', maxPower: 100 },
  { id: 4, resource: 'Network Ports', rack: 'RACK-D04', grid: 'D', used: 156, total: 200, unit: 'ports', utilization: 78, status: 'good', maxPower: 200 },
  { id: 5, resource: 'Storage', rack: 'RACK-E05', grid: 'E', used: 45, total: 60, unit: 'TB', utilization: 75, status: 'good', maxPower: 60 },
  { id: 6, resource: 'Bandwidth', rack: 'RACK-F06', grid: 'F', used: 780, total: 1000, unit: 'Mbps', utilization: 78, status: 'good', maxPower: 1000 }
])

// Cage B - Capacity data
const capacityDataB = ref([
  { id: 1, resource: 'Rack Space', rack: 'RACK-G01', grid: 'G', used: 64, total: 80, unit: 'U', utilization: 80, status: 'good', maxPower: 80 },
  { id: 2, resource: 'Power Capacity', rack: 'RACK-H02', grid: 'H', used: 22.8, total: 40, unit: 'kW', utilization: 57, status: 'good', maxPower: 40 },
  { id: 3, resource: 'Cooling Capacity', rack: 'RACK-I03', grid: 'I', used: 78, total: 100, unit: 'tons', utilization: 78, status: 'good', maxPower: 100 },
  { id: 4, resource: 'Network Ports', rack: 'RACK-J04', grid: 'J', used: 142, total: 200, unit: 'ports', utilization: 71, status: 'good', maxPower: 200 },
  { id: 5, resource: 'Storage', rack: 'RACK-K05', grid: 'K', used: 38, total: 60, unit: 'TB', utilization: 63, status: 'good', maxPower: 60 },
  { id: 6, resource: 'Bandwidth', rack: 'RACK-L06', grid: 'L', used: 720, total: 1000, unit: 'Mbps', utilization: 72, status: 'good', maxPower: 1000 }
])

// Site-level data for Estate Level view
const siteThermalData = ref([
  { id: 1, site: 'Data Center 1', avgTemp: 22.3, minTemp: 20.1, maxTemp: 24.8, humidity: 45, outletTemp: 24.2, status: 'optimal', compliance: 'optimal' },
  { id: 2, site: 'Data Center 2', avgTemp: 23.1, minTemp: 21.2, maxTemp: 25.5, humidity: 48, outletTemp: 25.1, status: 'good', compliance: 'good' },
  { id: 3, site: 'Data Center 3', avgTemp: 21.8, minTemp: 19.5, maxTemp: 24.2, humidity: 42, outletTemp: 23.8, status: 'optimal', compliance: 'optimal' },
  { id: 4, site: 'Remote Site', avgTemp: 24.2, minTemp: 22.1, maxTemp: 26.8, humidity: 52, outletTemp: 26.1, status: 'warning', compliance: 'warning' }
])

const sitePowerData = ref([
  { id: 1, site: 'Data Center 1', totalPower: 45.2, avgPower: 42.8, peakPower: 48.1, utilization: 85, pue: 1.42, status: 'good' },
  { id: 2, site: 'Data Center 2', totalPower: 38.7, avgPower: 36.2, peakPower: 41.5, utilization: 78, pue: 1.38, status: 'good' },
  { id: 3, site: 'Data Center 3', totalPower: 52.1, avgPower: 48.9, peakPower: 55.3, utilization: 92, pue: 1.48, status: 'warning' },
  { id: 4, site: 'Remote Site', totalPower: 41.3, avgPower: 39.1, peakPower: 44.2, utilization: 81, pue: 1.35, status: 'good' }
])

const siteCapacityData = ref([
  { id: 1, site: 'Data Center 1', totalRacks: 12, usedRacks: 10, availableRacks: 2, utilization: 83, status: 'good', maxPower: 480 },
  { id: 2, site: 'Data Center 2', totalRacks: 15, usedRacks: 11, availableRacks: 4, utilization: 73, status: 'good', maxPower: 525 },
  { id: 3, site: 'Data Center 3', totalRacks: 10, usedRacks: 9, availableRacks: 1, utilization: 90, status: 'warning', maxPower: 400 },
  { id: 4, site: 'Remote Site', totalRacks: 18, usedRacks: 14, availableRacks: 4, utilization: 78, status: 'good', maxPower: 580 }
])

// Room-level data for Site Level view
const roomThermalData = ref([
  { id: 1, room: 'Floor 1', avgTemp: 22.3, minTemp: 20.1, maxTemp: 24.8, humidity: 45, outletTemp: 24.2, status: 'optimal', compliance: 'optimal' },
  { id: 2, room: 'Floor 2', avgTemp: 23.1, minTemp: 21.2, maxTemp: 25.5, humidity: 48, outletTemp: 25.1, status: 'good', compliance: 'good' },
  { id: 3, room: 'Floor 3', avgTemp: 21.8, minTemp: 19.5, maxTemp: 24.2, humidity: 42, outletTemp: 23.8, status: 'optimal', compliance: 'optimal' },
  { id: 4, room: 'Floor 4', avgTemp: 24.2, minTemp: 22.1, maxTemp: 26.8, humidity: 52, outletTemp: 26.1, status: 'warning', compliance: 'warning' },
  { id: 5, room: 'Floor 5', avgTemp: 22.7, minTemp: 20.8, maxTemp: 25.1, humidity: 46, outletTemp: 24.9, status: 'good', compliance: 'good' }
])

const roomPowerData = ref([
  { id: 1, room: 'Floor 1', totalPower: 45.2, avgPower: 42.8, peakPower: 48.1, utilization: 85, pue: 1.44, status: 'good' },
  { id: 2, room: 'Floor 2', totalPower: 38.7, avgPower: 36.2, peakPower: 41.5, utilization: 78, pue: 1.39, status: 'good' },
  { id: 3, room: 'Floor 3', totalPower: 52.1, avgPower: 48.9, peakPower: 55.3, utilization: 92, pue: 1.47, status: 'warning' },
  { id: 4, room: 'Floor 4', totalPower: 41.3, avgPower: 39.1, peakPower: 44.2, utilization: 81, pue: 1.36, status: 'good' },
  { id: 5, room: 'Floor 5', totalPower: 47.8, avgPower: 44.6, peakPower: 51.2, utilization: 88, pue: 1.41, status: 'good' }
])

const roomCapacityData = ref([
  { id: 1, room: 'Floor 1', totalRacks: 12, usedRacks: 10, availableRacks: 2, utilization: 83, status: 'good', maxPower: 160 },
  { id: 2, room: 'Floor 2', totalRacks: 15, usedRacks: 11, availableRacks: 4, utilization: 73, status: 'good', maxPower: 180 },
  { id: 3, room: 'Floor 3', totalRacks: 10, usedRacks: 9, availableRacks: 1, utilization: 90, status: 'warning', maxPower: 140 },
  { id: 4, room: 'Floor 4', totalRacks: 18, usedRacks: 14, availableRacks: 4, utilization: 78, status: 'good', maxPower: 210 },
  { id: 5, room: 'Floor 5', totalRacks: 14, usedRacks: 12, availableRacks: 2, utilization: 86, status: 'good', maxPower: 170 }
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
  itemLabel.value = ''
  selectedAggregateLevel.value = 'Estate Level'
  dateRange.value = { start: '', end: '' }
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

const updateSummaryDatatypeSelection = () => {
  // When datatypes are selected/deselected, set default aggregation to ['Avg'] for new ones
  selectedSummaryDatatype.value.forEach(datatype => {
    if (!selectedAggregation.value[datatype] || selectedAggregation.value[datatype].length === 0) {
      selectedAggregation.value[datatype] = ['Avg']
    }
  })
  
  // Remove aggregations for deselected datatypes (only if not in other selections)
  Object.keys(selectedAggregation.value).forEach(datatype => {
    if (!selectedSummaryDatatype.value.includes(datatype) && 
        !selectedThermalDatatype.value.includes(datatype) && 
        !selectedPowerDatatype.value.includes(datatype)) {
      delete selectedAggregation.value[datatype]
    }
  })
}

const updateThermalDatatypeSelection = () => {
  // When datatypes are selected/deselected, set default aggregation to ['Avg'] for new ones
  selectedThermalDatatype.value.forEach(datatype => {
    if (!selectedAggregation.value[datatype] || selectedAggregation.value[datatype].length === 0) {
      selectedAggregation.value[datatype] = ['Avg']
    }
  })
  
  // Remove aggregations for deselected datatypes (only if not in other selections)
  Object.keys(selectedAggregation.value).forEach(datatype => {
    if (!selectedThermalDatatype.value.includes(datatype) && 
        !selectedSummaryDatatype.value.includes(datatype) && 
        !selectedPowerDatatype.value.includes(datatype)) {
      delete selectedAggregation.value[datatype]
    }
  })
}

const updatePowerDatatypeSelection = () => {
  // When datatypes are selected/deselected, set default aggregation to ['Avg'] for new ones
  selectedPowerDatatype.value.forEach(datatype => {
    if (!selectedAggregation.value[datatype] || selectedAggregation.value[datatype].length === 0) {
      selectedAggregation.value[datatype] = ['Avg']
    }
  })
  
  // Remove aggregations for deselected datatypes (only if not in other selections)
  Object.keys(selectedAggregation.value).forEach(datatype => {
    if (!selectedPowerDatatype.value.includes(datatype) && 
        !selectedSummaryDatatype.value.includes(datatype) && 
        !selectedThermalDatatype.value.includes(datatype)) {
      delete selectedAggregation.value[datatype]
    }
  })
}

const updateDatatypeAggregation = (datatype: string, aggregation: string, isChecked: boolean) => {
  if (!selectedAggregation.value[datatype]) {
    selectedAggregation.value[datatype] = []
  }
  
  if (isChecked) {
    // Add aggregation if not already present
    if (!selectedAggregation.value[datatype].includes(aggregation)) {
      selectedAggregation.value[datatype].push(aggregation)
    }
  } else {
    // Remove aggregation
    selectedAggregation.value[datatype] = selectedAggregation.value[datatype].filter(agg => agg !== aggregation)
  }
}

const getDatatypeValue = (datatype: string, aggregation: string) => {
  // Mock data generation based on datatype and aggregation
  const mockData = {
    'Power': { Max: '15.2kW', Min: '8.1kW', Avg: '11.5kW' },
    'Temperature': { Max: maxTemperature.value + '°C', Min: minTempRack.value?.minTemp + '°C' || '0.0°C', Avg: averageTemperature.value + '°C' },
    'Humidity': { Max: '65%', Min: '35%', Avg: '50%' },
    'Airflow': { Max: '850 CFM', Min: '420 CFM', Avg: '635 CFM' },
    'Utilization': { Max: '92%', Min: '18%', Avg: '68%' },
    'Dew Point': { Max: '18.5°C', Min: '12.2°C', Avg: '15.3°C' },
    'Voltage': { Max: '240V', Min: '220V', Avg: '230V' },
    'Amps': { Max: '45A', Min: '22A', Avg: '33A' },
    'Outlet T': { Max: '25.8°C', Min: '18.2°C', Avg: '22.1°C' },
    'PUE': { Max: '1.52', Min: '1.15', Avg: '1.35' },
    'Energy': { Max: '118kWh', Min: '29kWh', Avg: '68kWh' },
    'Compliance': { Max: '100%', Min: '85%', Avg: '94%' }
  }
  
  return mockData[datatype as keyof typeof mockData]?.[aggregation as keyof typeof mockData.Power] || 'N/A'
}

const getDatatypeRack = (datatype: string, aggregation: string) => {
  // Return rack labels based on datatype and aggregation
  if (datatype === 'Temperature') {
    if (aggregation === 'Max') return maxTempRack.value?.rackLabel || 'N/A'
    if (aggregation === 'Min') return minTempRack.value?.rackLabel || 'N/A'
    return '-'
  }
  
  // Mock rack assignments using actual rack labels
  const mockRacks = {
    'Power': { Max: 'RACK-A01', Min: 'RACK-C03', Avg: '-' },
    'Humidity': { Max: 'RACK-B02', Min: 'RACK-D04', Avg: '-' },
    'Airflow': { Max: 'RACK-E05', Min: 'RACK-F06', Avg: '-' },
    'Utilization': { Max: 'RACK-G01', Min: 'RACK-H02', Avg: '-' },
    'Dew Point': { Max: 'RACK-I03', Min: 'RACK-J04', Avg: '-' },
    'Voltage': { Max: 'RACK-K05', Min: 'RACK-L06', Avg: '-' },
    'Amps': { Max: 'RACK-A01', Min: 'RACK-B02', Avg: '-' },
    'Outlet T': { Max: 'RACK-C03', Min: 'RACK-D04', Avg: '-' },
    'Energy': { Max: 'RACK-E05', Min: 'RACK-F06', Avg: '-' },
    'Compliance': { Max: 'RACK-G01', Min: 'RACK-H02', Avg: '-' },
    'PUE': { Max: 'RACK-A01', Min: 'RACK-C03', Avg: '-' }
  }
  
  return mockRacks[datatype as keyof typeof mockRacks]?.[aggregation as keyof typeof mockRacks.Power] || '-'
}

const getMultiAggregationValues = (datatype: string) => {
  const aggregations = selectedAggregation.value[datatype] || ['Avg']
  const values = aggregations.map(agg => {
    const value = getDatatypeValue(datatype, agg)
    return `${agg}: ${value}`
  })
  return values.join('<br>')
}

const getMultiAggregationRacks = (datatype: string) => {
  const aggregations = selectedAggregation.value[datatype] || ['Avg']
  const racks = aggregations.map(agg => {
    const rack = getDatatypeRack(datatype, agg)
    return rack === '-' ? `${agg}: -` : `${agg}: ${rack}`
  })
  return racks.join('<br>')
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
      return powerData.value
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
            <label>Aggregate Level</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('aggregateLevel')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.aggregateLevel }"
              >
                {{ selectedAggregateLevel }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.aggregateLevel" class="dropdown-content">
                <label v-for="option in ['Estate Level', 'Site Level', 'Room Level']" :key="option" class="checkbox-item">
                  <input 
                    type="radio" 
                    :value="option" 
                    v-model="selectedAggregateLevel"
                    name="aggregateLevel"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
          
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
            <label>Date Range</label>
            <div class="date-range-container">
              <div class="date-input-group">
                <label for="start-date" class="date-label">From</label>
                <input
                  id="start-date"
                  v-model="dateRange.start"
                  type="date"
                  class="date-input"
                />
              </div>
              <div class="date-input-group">
                <label for="end-date" class="date-label">To</label>
                <input
                  id="end-date"
                  v-model="dateRange.end"
                  type="date"
                  class="date-input"
                />
              </div>
            </div>
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
          
          <div v-if="selectedAggregateLevel === 'Estate Level' || selectedAggregateLevel === 'Site Level' || selectedAggregateLevel === 'Room Level'" class="filter-group">
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
          
          <div v-if="selectedAggregateLevel === 'Site Level' || selectedAggregateLevel === 'Room Level'" class="filter-group">
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
          
          <div v-if="selectedAggregateLevel === 'Room Level'" class="filter-group">
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
          
          <div v-if="selectedAggregateLevel === 'Room Level'" class="filter-group">
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

          <div v-if="selectedAggregateLevel === 'Room Level'" class="filter-group">
            <label for="item-label">Item Label</label>
            <input
              id="item-label"
              v-model="itemLabel"
              type="text"
              placeholder="Filter by item label..."
              class="filter-input"
            />
          </div>
          
          
          <div class="filter-group">
            <label>Summary Datatype (up to 5)</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('summaryDatatype')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.summaryDatatype }"
              >
                {{ getDropdownLabel('summaryDatatype', selectedSummaryDatatype, ['Power', 'PUE','Temperature', 'Humidity', 'Airflow', 'Utilization', 'Voltage', 'Amps','Energy','Compliance']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.summaryDatatype" class="dropdown-content">
                <label v-for="option in ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Voltage', 'Amps','Energy','Compliance']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedSummaryDatatype"
                    @change="updateSummaryDatatypeSelection"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
            
            <!-- Selected Datatypes with Aggregation Options -->
            <div v-if="selectedSummaryDatatype.length > 0" class="selected-datatypes-container">
              <div class="selected-datatype-item" v-for="datatype in selectedSummaryDatatype" :key="datatype">
                <div class="datatype-label">{{ datatype }}</div>
                <div class="aggregation-options">
                  <label v-for="agg in ['Max', 'Min', 'Avg']" :key="agg" class="aggregation-option">
                    <input 
                      type="checkbox" 
                      :value="agg"
                      :checked="selectedAggregation[datatype]?.includes(agg) || false"
                      @change="updateDatatypeAggregation(datatype, agg, ($event.target as HTMLInputElement)?.checked || false)"
                    />
                    <span class="aggregation-label">{{ agg }}</span>
                  </label>
                </div>
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
                {{ getDropdownLabel('thermalDatatype', selectedThermalDatatype, ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T', 'Low Inlet Temp']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.thermalDatatype" class="dropdown-content">
                <label v-for="option in ['Temperature', 'Humidity', 'Dew Point', 'Outlet T','Compliance']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedThermalDatatype"
                    @change="updateThermalDatatypeSelection"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
            
            <!-- Selected Datatypes with Aggregation Options -->
            <div v-if="selectedThermalDatatype.length > 0" class="selected-datatypes-container">
              <div class="selected-datatype-item" v-for="datatype in selectedThermalDatatype" :key="datatype">
                <div class="datatype-label">{{ datatype }}</div>
                <div class="aggregation-options">
                  <label v-for="agg in ['Max', 'Min', 'Avg']" :key="agg" class="aggregation-option">
                    <input 
                      type="checkbox" 
                      :value="agg"
                      :checked="selectedAggregation[datatype]?.includes(agg) || false"
                      @change="updateDatatypeAggregation(datatype, agg, ($event.target as HTMLInputElement)?.checked || false)"
                    />
                    <span class="aggregation-label">{{ agg }}</span>
                  </label>
                </div>
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
                <label v-for="option in ['PUE', 'Power', 'Voltage', 'Amps','Energy']" :key="option" class="checkbox-item">
                  <input 
                    type="checkbox" 
                    :value="option" 
                    v-model="selectedPowerDatatype"
                    @change="updatePowerDatatypeSelection"
                  />
                  <span class="checkbox-label">{{ option }}</span>
                </label>
              </div>
            </div>
            
            <!-- Selected Datatypes with Aggregation Options -->
            <div v-if="selectedPowerDatatype.length > 0" class="selected-datatypes-container">
              <div class="selected-datatype-item" v-for="datatype in selectedPowerDatatype" :key="datatype">
                <div class="datatype-label">{{ datatype }}</div>
                <div class="aggregation-options">
                  <label v-for="agg in ['Max', 'Min', 'Avg']" :key="agg" class="aggregation-option">
                    <input 
                      type="checkbox" 
                      :value="agg"
                      :checked="selectedAggregation[datatype]?.includes(agg) || false"
                      @change="updateDatatypeAggregation(datatype, agg, ($event.target as HTMLInputElement)?.checked || false)"
                    />
                    <span class="aggregation-label">{{ agg }}</span>
                  </label>
                </div>
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
                {{ getDropdownLabel('capacityDatatype', selectedCapacityDatatype, ['Measured', 'Allocated', 'Reserved', 'Space', 'MAXIMUMPOWER']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.capacityDatatype" class="dropdown-content">
                <label v-for="option in ['Measured', 'Allocated', 'Reserved', 'Space']" :key="option" class="checkbox-item">
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
            <label>Data Resolution</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('dataResolution')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.dataResolution }"
              >
                {{ getDropdownLabel('dataResolution', selectedDataResolution, ['1 minute', '2 minutes','5 minutes', '15 minutes', '1 hour', '1 day']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.dataResolution" class="dropdown-content">
                <label v-for="option in ['1 minute', '2 minutes','5 minutes', '15 minutes', '1 hour', '1 day']" :key="option" class="checkbox-item">
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
              <svg class="line-chart" viewBox="0 0 600 150" preserveAspectRatio="xMidYMid meet">
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
            <h3 class="stats-table-title">Group Performance Summary</h3>
            <div class="stats-table-container">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th class="stat-header-label">Metric</th>
                    <th class="stat-header-value">Value</th>
                    <th class="stat-header-rack">Rack</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Dynamic rows based on selected datatypes with multiple aggregations in single cell -->
                  <tr v-for="datatype in selectedSummaryDatatype" :key="datatype">
                    <td class="stat-label">{{ datatype }}</td>
                    <td class="stat-value stat-multi-value" v-html="getMultiAggregationValues(datatype)"></td>
                    <td class="stat-rack stat-multi-rack" v-html="getMultiAggregationRacks(datatype)"></td>
                  </tr>
                  
                  <!-- Static rows for general info -->
                  <tr v-if="selectedSummaryDatatype.length === 0">
                    <td class="stat-label">Average Temperature</td>
                    <td class="stat-value">{{ averageTemperature }}°C</td>
                    <td class="stat-rack">-</td>
                  </tr>
                  <tr v-if="selectedSummaryDatatype.length === 0">
                    <td class="stat-label">Max Temperature</td>
                    <td class="stat-value">{{ maxTemperature }}°C</td>
                    <td class="stat-rack">{{ maxTempRack?.rackLabel || 'N/A' }}</td>
                  </tr>
                  <tr v-if="selectedSummaryDatatype.length === 0">
                    <td class="stat-label">Min Temperature</td>
                    <td class="stat-value">{{ minTempRack?.minTemp || '0.0' }}°C</td>
                    <td class="stat-rack">{{ minTempRack?.rackLabel || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <td class="stat-label">Number of Racks</td>
                    <td class="stat-value">{{ powerStats.rackCount }}</td>
                    <td class="stat-rack">-</td>
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
                  <th>{{ selectedAggregateLevel === 'Estate Level' ? 'Site' : selectedAggregateLevel === 'Site Level' ? 'Room' : 'Rack Label' }}</th>
                  <th>{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Grid' }}</th>
                  <th v-if="showThermalColumns.temperature">Temperature Range</th>
                  <th v-if="showThermalColumns.temperature">Avg Temp</th>
                  <th v-if="showThermalColumns.humidity">Humidity</th>
                  <th v-if="showThermalColumns.dewPoint">Dew Point</th>
                  <th v-if="showThermalColumns.outletT">Outlet T</th>
                  <th v-if="showThermalColumns.compliance">Compliance</th>
                  <th>Graph</th>
                </tr>
              </thead>
              <tbody>
                <!-- Estate Level: Show site data -->
                <template v-if="selectedAggregateLevel === 'Estate Level'">
                  <tr v-for="site in siteThermalData" :key="site.id" class="data-row">
                    <td class="name-cell">{{ site.site }}</td>
                    <td class="name-cell">-</td>
                    <td v-if="showThermalColumns.temperature" class="value-cell">
                      <div class="temp-range">
                        <span class="temp-min">{{ site.minTemp }}°C</span>
                        <span class="temp-separator">-</span>
                        <span class="temp-max">{{ site.maxTemp }}°C</span>
                      </div>
                    </td>
                    <td v-if="showThermalColumns.temperature" class="value-cell">{{ site.avgTemp }}°C</td>
                    <td v-if="showThermalColumns.humidity" class="value-cell">{{ site.humidity }}%</td>
                    <td v-if="showThermalColumns.dewPoint" class="value-cell">N/A</td>
                    <td v-if="showThermalColumns.outletT" class="value-cell">{{ site.outletTemp }}°C</td>
                    <td v-if="showThermalColumns.compliance" class="status-cell">
                      <span :class="getThermalStatusClass(site.status)" class="status-badge">
                        {{ site.status }}
                      </span>
                    </td>
                    <td class="action-cell">
                      <button @click="showGraph(site, 'thermal')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                    </td>
                  </tr>
                </template>
                <!-- Site Level: Show room data -->
                <template v-else-if="selectedAggregateLevel === 'Site Level'">
                  <tr v-for="room in roomThermalData" :key="room.id" class="data-row">
                    <td class="name-cell">{{ room.room }}</td>
                    <td class="name-cell">-</td>
                    <td v-if="showThermalColumns.temperature" class="value-cell">
                      <div class="temp-range">
                        <span class="temp-min">{{ room.minTemp }}°C</span>
                        <span class="temp-separator">-</span>
                        <span class="temp-max">{{ room.maxTemp }}°C</span>
                      </div>
                    </td>
                    <td v-if="showThermalColumns.temperature" class="value-cell">{{ room.avgTemp }}°C</td>
                    <td v-if="showThermalColumns.humidity" class="value-cell">{{ room.humidity }}%</td>
                    <td v-if="showThermalColumns.dewPoint" class="value-cell">N/A</td>
                    <td v-if="showThermalColumns.outletT" class="value-cell">{{ room.outletTemp }}°C</td>
                    <td v-if="showThermalColumns.compliance" class="status-cell">
                      <span :class="getThermalStatusClass(room.status)" class="status-badge">
                        {{ room.status }}
                      </span>
                    </td>
                    <td class="action-cell">
                      <button @click="showGraph(room, 'thermal')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                    </td>
                  </tr>
                </template>
                <!-- Room Level: Show rack data -->
                <template v-else>
                <tr v-for="thermal in thermalData" :key="thermal.id" class="data-row">
                  <td class="name-cell">{{ thermal.rackLabel }}</td>
                  <td class="name-cell">{{ thermal.grid }}</td>
                  <td v-if="showThermalColumns.temperature" class="value-cell">
                    <div class="temp-range">
                      <span class="temp-min">{{ thermal.minTemp }}°C</span>
                      <span class="temp-separator">-</span>
                      <span class="temp-max">{{ thermal.maxTemp }}°C</span>
                    </div>
                  </td>
                  <td v-if="showThermalColumns.temperature" class="value-cell">{{ thermal.avgTemp }}°C</td>
                  <td v-if="showThermalColumns.humidity" class="value-cell">{{ thermal.humidity }}%</td>
                  <td v-if="showThermalColumns.dewPoint" class="value-cell">N/A</td>
                  <td v-if="showThermalColumns.outletT" class="value-cell">{{ thermal.outletT }}°C</td>
                  <td v-if="showThermalColumns.compliance" class="status-cell">
                    <span :class="getThermalStatusClass(thermal.status)" class="status-badge">
                      {{ thermal.status }}
                    </span>
                  </td>
                    <td class="action-cell">
                      <button @click="showGraph(thermal, 'thermal')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                  </td>
                </tr>
                </template>
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
                  <th>{{ selectedAggregateLevel === 'Estate Level' ? 'Site' : selectedAggregateLevel === 'Site Level' ? 'Room' : 'Rack Label' }}</th>
                  <th v-if="showPowerColumns.pue">PUE</th>
                  <th>{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Grid' }}</th>
                  <th v-if="showPowerColumns.voltage">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Voltage' }}</th>
                  <th v-if="showPowerColumns.amps">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Current' }}</th>
                  <th v-if="showPowerColumns.power">{{ selectedAggregateLevel === 'Estate Level' ? 'Total Power' : selectedAggregateLevel === 'Site Level' ? 'Total Power' : 'Power' }}</th>
                  <th v-if="showPowerColumns.energy">Energy</th>
                  <th>Graph</th>
                </tr>
              </thead>
              <tbody>
                <!-- Estate Level: Show site data -->
                <template v-if="selectedAggregateLevel === 'Estate Level'">
                  <tr v-for="site in sitePowerData" :key="site.id" class="data-row">
                    <td class="name-cell">{{ site.site }}</td>
                    <td v-if="showPowerColumns.pue" class="value-cell">{{ site.pue }}</td>
                    <td class="name-cell">-</td>
                    <td v-if="showPowerColumns.power" class="value-cell">{{ site.totalPower }}kW</td>
                    <td v-if="showPowerColumns.energy" class="value-cell">N/A</td>
                    <td class="action-cell">
                      <button @click="showGraph(site, 'power')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                    </td>
                  </tr>
                </template>
                <!-- Site Level: Show room data -->
                <template v-else-if="selectedAggregateLevel === 'Site Level'">
                  <tr v-for="room in roomPowerData" :key="room.id" class="data-row">
                    <td class="name-cell">{{ room.room }}</td>
                    <td v-if="showPowerColumns.pue" class="value-cell">{{ room.pue }}</td>
                    <td class="name-cell">-</td>
                    <td v-if="showPowerColumns.power" class="value-cell">{{ room.totalPower }}kW</td>
                    <td v-if="showPowerColumns.energy" class="value-cell">N/A</td>
                    <td class="action-cell">
                      <button @click="showGraph(room, 'power')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                    </td>
                  </tr>
                </template>
                <!-- Room Level: Show rack data -->
                <template v-else>
                <tr v-for="power in powerData" :key="power.id" class="data-row">
                    <td class="name-cell">{{ power.rack }}</td>
                    <td v-if="showPowerColumns.pue" class="value-cell">{{ power.pue }}</td>
                    <td class="name-cell">{{ power.grid }}</td>
                  <td v-if="showPowerColumns.voltage" class="value-cell">{{ power.voltage }}V</td>
                  <td v-if="showPowerColumns.amps" class="value-cell">{{ power.current }}A</td>
                  <td v-if="showPowerColumns.power" class="value-cell">{{ power.power }}kW</td>
                  <td v-if="showPowerColumns.energy" class="value-cell">N/A</td>
                    <td class="action-cell">
                      <button @click="showGraph(power, 'power')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                  </td>
                </tr>
                </template>
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
                  <th>{{ selectedAggregateLevel === 'Estate Level' ? 'Site' : selectedAggregateLevel === 'Site Level' ? 'Room' : 'Rack Label' }}</th>
                  <th>{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Grid' }}</th>
                  <th v-if="showCapacityColumns.measured">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Measured' }}</th>
                  <th v-if="showCapacityColumns.allocated">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Allocated' }}</th>
                  <th v-if="showCapacityColumns.reserved">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Reserved' }}</th>
                  <th v-if="showCapacityColumns.space">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Space' }}</th>
                  <th v-if="showCapacityColumns.maxPower">{{ selectedAggregateLevel === 'Estate Level' ? 'Max Power' : selectedAggregateLevel === 'Site Level' ? 'Max Power' : 'Max Power' }}</th>
                  <th>Graph</th>
                </tr>
              </thead>
              <tbody>
                <!-- Estate Level: Show site data -->
                <template v-if="selectedAggregateLevel === 'Estate Level'">
                  <tr v-for="site in siteCapacityData" :key="site.id" class="data-row">
                    <td class="name-cell">{{ site.site }}</td>
                    <td class="name-cell">-</td>
                    <td class="value-cell">{{ site.totalRacks }} racks</td>
                    <td class="value-cell">{{ site.usedRacks }} racks</td>
                    <td class="value-cell">{{ site.usedRacks }} racks</td>
                    <td class="value-cell">{{ site.availableRacks }} racks</td>
                    <td class="value-cell">{{ site.utilization }}%</td>
                    <td v-if="showCapacityColumns.maxPower" class="value-cell">{{ site.maxPower }} kW</td>
                    <td class="action-cell">
                      <button @click="showGraph(site, 'capacity')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                    </td>
                  </tr>
                </template>
                <!-- Site Level: Show room data -->
                <template v-else-if="selectedAggregateLevel === 'Site Level'">
                  <tr v-for="room in roomCapacityData" :key="room.id" class="data-row">
                    <td class="name-cell">{{ room.room }}</td>
                    <td class="name-cell">-</td>
                    <td class="value-cell">{{ room.totalRacks }} racks</td>
                    <td class="value-cell">{{ room.usedRacks }} racks</td>
                    <td class="value-cell">{{ room.usedRacks }} racks</td>
                    <td class="value-cell">{{ room.availableRacks }} racks</td>
                    <td class="value-cell">{{ room.utilization }}%</td>
                    <td v-if="showCapacityColumns.maxPower" class="value-cell">{{ room.maxPower }} kW</td>
                    <td class="action-cell">
                      <button @click="showGraph(room, 'capacity')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                    </td>
                  </tr>
                </template>
                <!-- Room Level: Show rack data -->
                <template v-else>
                <tr v-for="capacity in capacityData" :key="capacity.id" class="data-row">
                    <td class="name-cell">{{ capacity.rack }}</td>
                    <td class="name-cell">{{ capacity.grid }}</td>
                  <td class="value-cell">{{ capacity.maxPower }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.used }} {{ capacity.unit }}</td>
                  <td v-if="showCapacityColumns.reserved" class="value-cell">{{ capacity.total - capacity.used }} {{ capacity.unit }}</td>
                  <td v-if="showCapacityColumns.space" class="value-cell">{{ capacity.utilization }}%</td>
                  <td v-if="showCapacityColumns.maxPower" class="value-cell">{{ capacity.maxPower }} {{ capacity.unit }}</td>
                    <td class="action-cell">
                      <button @click="showGraph(capacity, 'capacity')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                  </td>
                </tr>
                </template>
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
                  <th>Graph</th>
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
                  <td class="action-cell">
                    <button @click="showGraph(thermal, 'thermal')" class="graph-btn" title="View Time Series Graph">
                      📊
                    </button>
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
                  <th>Rack Label</th>
                  <th>PUE</th>
                  <th>Grid</th>
                  <th>Voltage</th>
                  <th>Current</th>
                  <th>Power</th>
                  <th>Load</th>
                  <th>Graph</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="power in powerDataB" :key="power.id" class="data-row">
                  <td class="name-cell">{{ power.rack }}</td>
                  <td class="value-cell">{{ power.pue }}</td>
                  <td class="name-cell">{{ power.grid }}</td>
                  <td class="value-cell">{{ power.voltage }}V</td>
                  <td class="value-cell">{{ power.current }}A</td>
                  <td class="value-cell">{{ power.power }}kW</td>
                  <td class="value-cell">{{ power.load }}%</td>
                  <td class="action-cell">
                    <button @click="showGraph(power, 'power')" class="graph-btn" title="View Time Series Graph">
                      📊
                    </button>
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
                  <th>Rack Label</th>
                  <th>Grid</th>
                  <th>Max Power</th>
                  <th>Measured</th>
                  <th>Allocated</th>
                  <th>Reserved</th>
                  <th>Space</th>
                  <th>Graph</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="capacity in capacityDataB" :key="capacity.id" class="data-row">
                  <td class="name-cell">{{ capacity.rack }}</td>
                  <td class="name-cell">{{ capacity.grid }}</td>
                  <td class="value-cell">{{ capacity.total }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.total - capacity.used }} {{ capacity.unit }}</td>
                  <td class="value-cell">{{ capacity.utilization }}%</td>
                  <td class="action-cell">
                    <button @click="showGraph(capacity, 'capacity')" class="graph-btn" title="View Time Series Graph">
                      📊
                    </button>
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

  <!-- Graph Modal -->
  <div v-if="showGraphModal" class="modal-overlay" @click="closeGraphModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ selectedGraphTitle }}</h3>
        <button @click="closeGraphModal" class="modal-close-btn">×</button>
      </div>
      <div class="modal-body">
        <div v-if="selectedGraphData && selectedGraphData.length > 0" class="graph-container">
          <svg class="time-series-chart" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
            <!-- Grid lines -->
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" stroke-width="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            <!-- Chart area -->
            <rect x="60" y="40" width="720" height="320" fill="none" stroke="#4b5563" stroke-width="1"/>
            
            <!-- Data line -->
            <polyline
              :points="selectedGraphData?.map((point, index) => {
                const x = 60 + (index * 720 / ((selectedGraphData?.length || 1) - 1))
                const y = 360 - ((point.value / Math.max(...(selectedGraphData?.map(p => p.value) || [1]))) * 320)
                return `${x},${y}`
              }).join(' ') || ''"
              fill="none"
              stroke="#3b82f6"
              stroke-width="3"
            />
            
            <!-- Data points -->
            <circle
              v-for="(point, index) in selectedGraphData || []"
              :key="index"
              :cx="60 + (index * 720 / ((selectedGraphData?.length || 1) - 1))"
              :cy="360 - ((point.value / Math.max(...(selectedGraphData?.map(p => p.value) || [1]))) * 320)"
              r="4"
              fill="#3b82f6"
            />
            
            <!-- X-axis labels (time) -->
            <text
              v-for="(point, index) in (selectedGraphData || []).filter((_, i) => i % 4 === 0)"
              :key="index"
              :x="60 + (index * 4 * 720 / ((selectedGraphData?.length || 1) - 1))"
              y="390"
              class="axis-label"
              text-anchor="middle"
            >
              {{ new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </text>
            
            <!-- Y-axis labels -->
            <text
              v-for="(value, index) in [0, 0.25, 0.5, 0.75, 1]"
              :key="index"
              x="50"
              :y="360 - (value * 320) + 5"
              class="axis-label"
              text-anchor="end"
            >
              {{ (Math.max(...(selectedGraphData?.map(p => p.value) || [1])) * value).toFixed(1) }}
            </text>
            
            <!-- Y-axis unit -->
            <text x="20" y="200" class="y-axis-label" transform="rotate(-90, 20, 200)">
              {{ selectedGraphData?.[0]?.unit || '' }}
            </text>
          </svg>
        </div>
        <div v-else class="no-data">
          <p>No time series data available</p>
        </div>
      </div>
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
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-section {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  padding: 1.5rem;
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
  padding: 1.5rem;
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
  margin: 0 0 1rem 0;
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

.stats-table th {
  padding: 0.5rem 0;
  font-size: 0.875rem;
  border-bottom: 2px solid #475569;
}

.stats-table td {
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.stat-header-label {
  color: #94a3b8;
  font-weight: 600;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
}

.stat-header-value {
  color: #94a3b8;
  font-weight: 600;
  text-align: right;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
}

.stat-header-rack {
  color: #94a3b8;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
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

.stat-rack {
  color: #60a5fa;
  font-weight: 500;
  text-align: center;
  font-size: 0.8rem;
}

.stat-multi-value {
  text-align: left;
  line-height: 1.6;
  padding: 0.75rem 0.5rem;
}

.stat-multi-rack {
  text-align: left;
  line-height: 1.6;
  padding: 0.75rem 0.5rem;
  font-size: 0.75rem;
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
  margin-bottom: 1rem;
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
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0;
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

.dropdown-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.dropdown-row .dropdown-checkbox {
  flex: 1;
}

.selected-datatypes-container {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.selected-datatype-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
}

.selected-datatype-item:last-child {
  border-bottom: none;
}

.datatype-label {
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.9rem;
}

.aggregation-options {
  display: flex;
  gap: 1rem;
}

.aggregation-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.aggregation-option input[type="checkbox"] {
  margin: 0;
  accent-color: #3b82f6;
}

.aggregation-label {
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 500;
}

.aggregation-option input[type="checkbox"]:checked + .aggregation-label {
  color: #60a5fa;
  font-weight: 600;
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
.filter-select:focus,
.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-range-container {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.date-label {
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.date-input {
  padding: 0.5rem;
  font-size: 0.8rem;
  border: 2px solid #475569;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  transition: all 0.2s ease;
}

.date-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.date-input::-webkit-datetime-edit-text {
  color: #cbd5e1;
}

.date-input::-webkit-datetime-edit-month-field,
.date-input::-webkit-datetime-edit-day-field,
.date-input::-webkit-datetime-edit-year-field {
  color: #f8fafc;
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

/* Graph Button Styles */
.graph-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: #6b7280;
}

.graph-btn:hover {
  background-color: #374151;
  color: #3b82f6;
  transform: scale(1.1);
}

.action-cell {
  text-align: center;
  padding: 0.5rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1f2937;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #374151;
}

.modal-header h3 {
  margin: 0;
  color: #f9fafb;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background-color: #374151;
  color: #f9fafb;
}

.modal-body {
  padding: 1.5rem;
}

.graph-container {
  width: 100%;
  height: 400px;
}

.time-series-chart {
  width: 100%;
  height: 100%;
}

.axis-label {
  fill: #9ca3af;
  font-size: 0.75rem;
  font-family: 'Inter', sans-serif;
}

.y-axis-label {
  fill: #6b7280;
  font-size: 0.875rem;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}
</style>
