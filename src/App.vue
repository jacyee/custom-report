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
  { id: 1, name: 'Rack A-01', category: 'Development', status: 'active', value: 15000, date: '2024-01-15', priority: 'high', customer: 'Acme Corp', site: 'Data Center 1', room: 'Floor 1', cage: 'DFM1', itemType: 'Rack', dataType: 'Power' },
  { id: 2, name: 'Rack A-02', category: 'Marketing', status: 'pending', value: 8500, date: '2024-01-20', priority: 'medium', customer: 'Tech Solutions', site: 'Data Center 2', room: 'Floor 2', cage: 'DFM2', itemType: 'Ambient Orb', dataType: 'Temperature' },
  { id: 3, name: 'Rack B-01', category: 'Sales', status: 'active', value: 22000, date: '2024-01-10', priority: 'high', customer: 'Data Systems', site: 'Data Center 1', room: 'Floor 3', cage: 'DFM3', itemType: 'Cooling', dataType: 'Humidity' },
  { id: 4, name: 'Rack B-02', category: 'Development', status: 'inactive', value: 12000, date: '2024-01-05', priority: 'low', customer: 'Cloud Services', site: 'Data Center 3', room: 'Floor 4', cage: 'Rack Group 1', itemType: 'Power', dataType: 'Airflow' },
  { id: 5, name: 'Rack C-01', category: 'Marketing', status: 'active', value: 18000, date: '2024-01-25', priority: 'medium', customer: 'Acme Corp', site: 'Remote Site', room: 'Floor 5', cage: 'Rack Group 2', itemType: 'Cooling', dataType: 'Utilization' },
  { id: 6, name: 'Rack C-02', category: 'Sales', status: 'pending', value: 9500, date: '2024-01-18', priority: 'high', customer: 'Tech Solutions', site: 'Data Center 2', room: 'Floor 6', cage: 'DFM1', itemType: 'Rack', dataType: 'Power' },
  { id: 7, name: 'Rack D-01', category: 'Development', status: 'active', value: 13500, date: '2024-01-12', priority: 'medium', customer: 'Data Systems', site: 'Data Center 1', room: 'Floor 7', cage: 'DFM2', itemType: 'Ambient Orb', dataType: 'Temperature' },
  { id: 8, name: 'Rack D-02', category: 'Marketing', status: 'inactive', value: 7500, date: '2024-01-08', priority: 'low', customer: 'Cloud Services', site: 'Data Center 3', room: 'Floor 1', cage: 'DFM3', itemType: 'Power', dataType: 'Humidity' }
])

// Filter states
const searchTerm = ref('')
const searchTerm2 = ref('')
const itemLabel = ref('')
const selectedCustomer = ref<string[]>([])
const selectedSite = ref<string[]>([])
const selectedRoom = ref<string[]>([])
const showSiteItems = ref(false)
const selectedCage = ref<string[]>([])
const selectedItemType = ref<string[]>([])
const selectedDataType = ref<string[]>([])
const selectedSummaryDatatype = ref<string[]>([])
const selectedThermalDatatype = ref<string[]>([])
const selectedPowerDatatype = ref<string[]>([])
const selectedCapacityDatatype = ref<string[]>([])
const selectedDataResolution = ref<string[]>([])
const selectedAggregation = ref<Record<string, string[]>>({})
const itemTypeOptions = ['Rack', 'Ambient Orb', 'Cooling', 'Power']
const itemTypeRadioOptions = ['All Item Types', ...itemTypeOptions]
const dateRange = ref({
  start: '',
  end: ''
})
type DatePresetKey = 'lastWeek' | 'lastMonth' | 'lastQuarter'

const datePresets: { id: DatePresetKey; label: string }[] = [
  { id: 'lastWeek', label: 'Last 7 days' },
  { id: 'lastMonth', label: 'Last 30 days' },
  { id: 'lastQuarter', label: 'Last 90 days' }
]

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getPresetRange = (preset: DatePresetKey) => {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  const offsets: Record<DatePresetKey, number> = {
    lastWeek: 6,
    lastMonth: 29,
    lastQuarter: 89
  }
  start.setDate(start.getDate() - offsets[preset])
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end)
  }
}

const setDatePreset = (preset: DatePresetKey) => {
  dateRange.value = getPresetRange(preset)
}

const clearDateRange = () => {
  dateRange.value = { start: '', end: '' }
}

const activeDatePreset = computed<DatePresetKey | null>(() => {
  const match = datePresets.find(preset => {
    const range = getPresetRange(preset.id)
    return dateRange.value.start === range.start && dateRange.value.end === range.end
  })
  return match ? match.id : null
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
const showCsvModal = ref(false)
const csvModalTitle = ref('')
const csvModalContent = ref('')
const csvPreviewRows = computed(() => {
  if (!csvModalContent.value) return []
  return csvModalContent.value
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1')))
})

// Graph modal state
interface TimeSeriesPoint {
  time: string
  value: number
  unit: string
}

interface GraphSeries {
  label: string
  unit: string
  points: TimeSeriesPoint[]
  color: string
}

const showGraphModal = ref(false)
const selectedGraphData = ref<GraphSeries[]>([])
const selectedGraphTitle = ref('')

// Chart dropdown state
const selectedChartDatatype = ref('Average Temperature')

// Tab states
const activeTab = ref('thermal')
const activeTabB = ref('thermal')
const tabs = ref([
  { id: 'thermal', label: 'Thermal', icon: '🌡️' },
  { id: 'power', label: 'Power', icon: '⚡' },
  { id: 'capacity', label: 'Capacity', icon: '🗄️' }
])
const isPowerItemType = computed(() => selectedItemType.value.map(v => v.toLowerCase()).includes('power'))
const powerPrimaryHeader = computed(() => {
  if (selectedAggregateLevel.value === 'Estate Level') return 'Site'
  if (selectedAggregateLevel.value === 'Site Level') return 'Room'
  return isPowerItemType.value ? 'PDU' : 'Rack Label'
})
const powerRowLabel = (record: any) => {
  if (selectedAggregateLevel.value === 'Estate Level') return record.site || '-'
  if (selectedAggregateLevel.value === 'Site Level') return record.room || '-'
  return isPowerItemType.value ? record.circuit || record.rack || 'PDU' : record.rack || record.circuit || 'Rack'
}
const powerRowLabelB = (record: any) => isPowerItemType.value ? record.circuit || record.rack || 'PDU' : record.rack || record.circuit || 'Rack'
const capacityPrimaryHeader = computed(() => {
  if (selectedAggregateLevel.value === 'Estate Level') return 'Site'
  if (selectedAggregateLevel.value === 'Site Level') return 'Room'
  return isPowerItemType.value ? 'PDU' : 'Rack Label'
})
const capacityRowLabel = (record: any) => {
  if (selectedAggregateLevel.value === 'Estate Level') return record.site || '-'
  if (selectedAggregateLevel.value === 'Site Level') return record.room || '-'
  return isPowerItemType.value ? record.circuit || record.rack || record.resource || 'PDU' : record.rack || record.resource || 'Rack'
}
const capacityRowLabelB = (record: any) => isPowerItemType.value ? record.circuit || record.rack || record.resource || 'PDU' : record.rack || record.resource || 'Rack'
const selectItemType = (option: string) => {
  selectedItemType.value = option === 'All Item Types' ? [] : [option]
  updateFilter()
}
const filteredTabs = computed(() => {
  const hasPower = isPowerItemType.value
  const hasCooling = selectedItemType.value.map(v => v.toLowerCase()).includes('cooling')
  if (hasPower && !hasCooling) {
    return tabs.value.filter(tab => tab.id === 'power' || tab.id === 'capacity')
  }
  if (hasCooling && !hasPower) {
    return [] // cooling handled in secondary tab set
  }
  return tabs.value
})
const tabOptionsB = computed(() => {
  const base = [
    { id: 'thermal', label: 'Thermal' },
    { id: 'power', label: 'Power' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'cooling', label: 'Cooling' }
  ]
  const hasPower = isPowerItemType.value
  const hasCooling = selectedItemType.value.map(v => v.toLowerCase()).includes('cooling')
  if (hasPower && !hasCooling) {
    return base.filter(tab => tab.id === 'power' || tab.id === 'capacity')
  }
  if (hasCooling && !hasPower) {
    return base.filter(tab => tab.id === 'cooling')
  }
  return base
})

// Computed filtered data (currently unused but kept for potential future use)
const filteredData = computed(() => {
  let filtered = data.value.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    const matchesCustomer = selectedCustomer.value.length === 0 || (item.customer && selectedCustomer.value.includes(item.customer))
    const matchesCustomRef2 = searchTerm2.value.trim() === '' || item.name.toLowerCase().includes(searchTerm2.value.toLowerCase())
    const matchesItemLabel = itemLabel.value.trim() === '' || item.name.toLowerCase().includes(itemLabel.value.toLowerCase())
    
    // Apply aggregate level filtering
    let matchesSite = true
    let matchesRoom = true
    
    if (selectedAggregateLevel.value === 'Site Level' || selectedAggregateLevel.value === 'Room Level') {
      const siteSelection = selectedSite.value
      matchesSite = siteSelection.length === 0 || siteSelection.includes('All Sites') || (item.site && siteSelection.includes(item.site)) || false
    }
    
    if (selectedAggregateLevel.value === 'Room Level') {
      const roomSelection = selectedRoom.value
      matchesRoom = roomSelection.length === 0 || roomSelection.includes('All Rooms') || (item.room && roomSelection.includes(item.room)) || false
    }
    
    const matchesCage = selectedCage.value.length === 0 || selectedCage.value.includes('All Rack Groups') || (item.cage && selectedCage.value.includes(item.cage))
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
    
    return matchesSearch && matchesCustomer && matchesCustomRef2 && matchesItemLabel && matchesSite && matchesRoom && matchesCage && matchesItemType && matchesDataType && matchesDateRange()
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

// Watch for changes in View selection
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

watch(filteredTabs, (newTabs) => {
  if (newTabs.length === 0) {
    activeTab.value = ''
    return
  }
  if (!newTabs.some(tab => tab.id === activeTab.value)) {
    activeTab.value = newTabs[0].id
  }
})

watch(tabOptionsB, (newTabs) => {
  if (newTabs.length === 0) {
    activeTabB.value = ''
    return
  }
  if (!newTabs.some(tab => tab.id === activeTabB.value)) {
    activeTabB.value = newTabs[0].id
  }
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
  const palette = ['#22d3ee', '#a855f7', '#f97316', '#38bdf8', '#34d399', '#facc15']
  let title = ''
  const series: GraphSeries[] = []

  if (type === 'thermal') {
    title = selectedAggregateLevel.value === 'Estate Level'
      ? `${record.site} - Thermal Time Series`
      : selectedAggregateLevel.value === 'Site Level'
        ? `${record.room} - Thermal Time Series`
        : `${record.rackLabel} - Thermal Time Series`
    series.push(
      { label: 'Avg Temp', unit: '°C', points: generateTimeSeriesData('temperature', record.avgTemp, '°C'), color: palette[0] },
      { label: 'Humidity', unit: '%', points: generateTimeSeriesData('humidity', record.humidity, '%'), color: palette[1] }
    )
    if (record.outletT) {
      series.push({ label: 'Outlet T', unit: '°C', points: generateTimeSeriesData('outlet', record.outletT, '°C'), color: palette[2] })
    }
  } else if (type === 'power') {
    title = selectedAggregateLevel.value === 'Estate Level'
      ? `${record.site} - Power Time Series`
      : selectedAggregateLevel.value === 'Site Level'
        ? `${record.room} - Power Time Series`
        : `${record.rack} - Power Time Series`
    const basePower = selectedAggregateLevel.value === 'Estate Level' || selectedAggregateLevel.value === 'Site Level'
      ? record.totalPower
      : record.power
    series.push(
      { label: 'Power', unit: 'kW', points: generateTimeSeriesData('power', basePower, 'kW'), color: palette[0] },
      { label: 'Voltage', unit: 'V', points: generateTimeSeriesData('voltage', record.voltage || 230, 'V'), color: palette[1] },
      { label: 'Current', unit: 'A', points: generateTimeSeriesData('current', record.current || 15, 'A'), color: palette[2] }
    )
  } else if (type === 'capacity') {
    title = selectedAggregateLevel.value === 'Estate Level'
      ? `${record.site} - Capacity Time Series`
      : selectedAggregateLevel.value === 'Site Level'
        ? `${record.room} - Capacity Time Series`
        : `${record.rack} - Capacity Time Series`
    series.push(
      { label: 'Utilization', unit: '%', points: generateTimeSeriesData('utilization', record.utilization, '%'), color: palette[0] },
      { label: 'Reserved', unit: record.unit || '%', points: generateTimeSeriesData('reserved', record.total - record.used, record.unit || ''), color: palette[1] }
    )
  }

  selectedGraphData.value = series
  selectedGraphTitle.value = title
  showGraphModal.value = true
}

// Close graph modal
const closeGraphModal = () => {
  showGraphModal.value = false
  selectedGraphData.value = null
  selectedGraphTitle.value = ''
}




// DFM2 Power statistics
const powerStatsB = computed(() => {
  const powers = powerDataB.value.map(item => item.power)
  const average = powers.reduce((sum, power) => sum + power, 0) / powers.length
  const peak = Math.max(...powers)
  const min = Math.min(...powers)
  const totalEnergy = powers.reduce((sum, power) => sum + power, 0) // Assuming 1 hour per data point
  const efficiency = Math.round((average / peak) * 100)
  const rackCount = 6 // Sample rack count for DFM2
  
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

// Dynamic header cards driven by summary selection
const topSummaryCards = computed(() => {
  if (selectedSummaryDatatype.value.length === 0) return []
  const cards: { label: string; value: string; rack?: string }[] = []
  selectedSummaryDatatype.value.forEach(datatype => {
    const aggs = selectedAggregation.value[datatype]?.length
      ? selectedAggregation.value[datatype]
      : ['Avg']
    aggs.forEach(agg => {
      const value = getDatatypeValue(datatype, agg)
      const rack = (agg === 'Max' || agg === 'Min') ? getDatatypeRack(datatype, agg) : ''
      cards.push({
        label: `${datatype} (${agg})`,
        value,
        rack: rack && rack !== '-' ? rack : ''
      })
    })
  })
  return cards.slice(0, 6)
})

// Banner text driven by selections
const bannerTitle = computed(() => {
  const selectedOr = (arr: string[], fallback: string) => arr.length ? arr.join(', ') : fallback
  const customer = selectedOr(selectedCustomer.value, 'All Customers')
  const site = selectedOr(selectedSite.value, 'All Sites')
  const room = selectedOr(selectedRoom.value, 'All Rooms')
  const cage = selectedOr(selectedCage.value, 'DFM1')
  return `${customer} - ${site} - ${room} - ${cage} - Rack Group 01-06`
})

const bannerSubtitle = computed(() => {
  const selectedOr = (arr: string[], fallback: string) => arr.length ? arr.join(', ') : fallback
  const cage = selectedOr(selectedCage.value, 'DFM1')
  return `Monitoring dashboard for racks A01 through F06 in ${cage}`
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
    voltage: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('Voltage'),
    amps: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('Amps'),
    power: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('Power'),
    energy: selectedPowerDatatype.value.length === 0 || selectedPowerDatatype.value.includes('Energy')
  }
})

const showCapacityColumns = computed(() => {
  const showAll = selectedCapacityDatatype.value.length === 0
  const hasOption = (option: string) => showAll || selectedCapacityDatatype.value.includes(option)
  return {
    measured: hasOption('Measured'),
    allocated: hasOption('Allocated'),
    reserved: hasOption('Reserved'),
    space: hasOption('Space')
  }
})

const averageField = (items: Array<Record<string, unknown>>, key: string) => {
  const values = items
    .map(item => Number(item[key]))
    .filter(value => Number.isFinite(value))
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const sumNumericField = (items: Array<Record<string, unknown>>, key: string) => {
  return items.reduce((sum, item) => {
    const value = Number(item[key])
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)
}

const formatKw = (value: number | string) => {
  const num = Number(value)
  return `${Number.isFinite(num) ? num.toFixed(1) : '0.0'} kW`
}

const formatKwh = (value: number | string) => {
  const num = Number(value)
  return `${Number.isFinite(num) ? num.toFixed(1) : '0.0'} kWh`
}

const capacityTableSubtotal = computed(() => {
  if (selectedAggregateLevel.value === 'Estate Level') {
    const measured = sumNumericField(siteCapacityData.value, 'totalRacks')
    const allocated = sumNumericField(siteCapacityData.value, 'usedRacks')
    const reserved = sumNumericField(siteCapacityData.value, 'availableRacks')
    const utilization = averageField(siteCapacityData.value as Array<Record<string, unknown>>, 'utilization')
    return { measured, allocated, reserved, subtotal: measured, utilization }
  }
  if (selectedAggregateLevel.value === 'Site Level') {
    const measured = sumNumericField(roomCapacityData.value, 'totalRacks')
    const allocated = sumNumericField(roomCapacityData.value, 'usedRacks')
    const reserved = sumNumericField(roomCapacityData.value, 'availableRacks')
    const utilization = averageField(roomCapacityData.value as Array<Record<string, unknown>>, 'utilization')
    return { measured, allocated, reserved, subtotal: measured, utilization }
  }
  const measured = sumNumericField(capacityData.value, 'used')
  const allocated = capacityData.value.reduce((sum, item) => sum + Math.max((Number(item.used) || 0) * 0.9, 0), 0)
  const reserved = capacityData.value.reduce((sum, item) => {
    const total = Number(item.total) || 0
    const used = Number(item.used) || 0
    return sum + Math.max(total - used, 0)
  }, 0)
  const subtotal = sumNumericField(capacityData.value, 'total')
  const utilization = averageField(capacityData.value as Array<Record<string, unknown>>, 'utilization')
  return { measured, allocated, reserved, subtotal, utilization }
})

const thermalTableSubtotal = computed(() => {
  let rows: Array<Record<string, unknown>> = []
  if (selectedAggregateLevel.value === 'Estate Level') {
    rows = siteThermalData.value
    return {
      minTemp: averageField(rows, 'minTemp'),
      maxTemp: averageField(rows, 'maxTemp'),
      avgTemp: averageField(rows, 'avgTemp'),
      humidity: averageField(rows, 'humidity'),
      outlet: averageField(rows, 'outletTemp')
    }
  }
  if (selectedAggregateLevel.value === 'Site Level') {
    rows = roomThermalData.value
    return {
      minTemp: averageField(rows, 'minTemp'),
      maxTemp: averageField(rows, 'maxTemp'),
      avgTemp: averageField(rows, 'avgTemp'),
      humidity: averageField(rows, 'humidity'),
      outlet: averageField(rows, 'outletTemp')
    }
  }
  rows = thermalData.value
  return {
    minTemp: averageField(rows, 'minTemp'),
    maxTemp: averageField(rows, 'maxTemp'),
    avgTemp: averageField(rows, 'avgTemp'),
    humidity: averageField(rows, 'humidity'),
    outlet: averageField(rows, 'outletT')
  }
})

const powerTableSubtotal = computed(() => {
  if (selectedAggregateLevel.value === 'Estate Level') {
    const totalPower = sumNumericField(sitePowerData.value, 'totalPower')
    const totalEnergy = sumNumericField(sitePowerData.value, 'energy')
    return {
      power: `${totalPower.toFixed(1)}kW`,
      energy: formatKwh(totalEnergy),
      voltage: averageField(sitePowerData.value, 'voltage'),
      current: averageField(sitePowerData.value, 'current')
    }
  }
  if (selectedAggregateLevel.value === 'Site Level') {
    const totalPower = sumNumericField(roomPowerData.value, 'totalPower')
    const totalEnergy = sumNumericField(roomPowerData.value, 'energy')
    return {
      power: `${totalPower.toFixed(1)}kW`,
      energy: formatKwh(totalEnergy),
      voltage: averageField(roomPowerData.value, 'voltage'),
      current: averageField(roomPowerData.value, 'current')
    }
  }
  const totalPower = sumNumericField(powerData.value, 'power')
  const totalEnergy = sumNumericField(powerData.value, 'energy')
  return {
    power: `${totalPower.toFixed(1)}kW`,
    energy: formatKwh(totalEnergy),
    voltage: averageField(powerData.value, 'voltage'),
    current: averageField(powerData.value, 'current')
  }
})

const powerTableSubtotalB = computed(() => {
  const totalPower = sumNumericField(powerDataB.value, 'power')
  const totalEnergy = sumNumericField(powerDataB.value, 'energy')
  const loadAverage = powerDataB.value.length
    ? powerDataB.value.reduce((sum, item) => sum + (Number(item.load) || 0), 0) / powerDataB.value.length
    : 0
  return {
    power: `${totalPower.toFixed(1)}kW`,
    load: `${loadAverage.toFixed(0)}%`,
    voltage: averageField(powerDataB.value, 'voltage'),
    current: averageField(powerDataB.value, 'current'),
    energy: formatKwh(totalEnergy)
  }
})

const thermalTableSubtotalB = computed(() => {
  return {
    minTemp: averageField(thermalDataB.value, 'minTemp'),
    maxTemp: averageField(thermalDataB.value, 'maxTemp'),
    avgTemp: averageField(thermalDataB.value, 'avgTemp'),
    humidity: averageField(thermalDataB.value, 'humidity'),
    outlet: averageField(thermalDataB.value, 'outletT')
  }
})

const capacityTableSubtotalB = computed(() => {
  const measured = sumNumericField(capacityDataB.value, 'used')
  const allocated = capacityDataB.value.reduce((sum, item) => sum + Math.max((Number(item.used) || 0) * 0.9, 0), 0)
  const reserved = capacityDataB.value.reduce((sum, item) => {
    const total = Number(item.total) || 0
    const used = Number(item.used) || 0
    return sum + Math.max(total - used, 0)
  }, 0)
  const subtotal = sumNumericField(capacityDataB.value, 'total')
  const utilization = averageField(capacityDataB.value as Array<Record<string, unknown>>, 'utilization')
  return { measured, allocated, reserved, subtotal, utilization }
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

// DFM1 - Thermal data
const thermalData = ref([
  { id: 1, rackLabel: 'RACK-A01', grid: 'A', minTemp: 20.1, maxTemp: 24.8, avgTemp: 22.5, humidity: 45, outletT: 24.2, status: 'optimal' },
  { id: 2, rackLabel: 'RACK-B02', grid: 'B', minTemp: 21.3, maxTemp: 26.2, avgTemp: 23.8, humidity: 48, outletT: 25.1, status: 'good' },
  { id: 3, rackLabel: 'RACK-C03', grid: 'C', minTemp: 22.1, maxTemp: 26.8, avgTemp: 24.2, humidity: 52, outletT: 26.5, status: 'warning' },
  { id: 4, rackLabel: 'RACK-D04', grid: 'D', minTemp: 19.8, maxTemp: 24.1, avgTemp: 21.9, humidity: 42, outletT: 23.8, status: 'optimal' },
  { id: 5, rackLabel: 'RACK-E05', grid: 'E', minTemp: 23.2, maxTemp: 27.5, avgTemp: 25.1, humidity: 55, outletT: 28.2, status: 'critical' },
  { id: 6, rackLabel: 'RACK-F06', grid: 'F', minTemp: 20.5, maxTemp: 25.3, avgTemp: 22.8, humidity: 46, outletT: 24.9, status: 'good' }
])

// DFM2 - Thermal data
const thermalDataB = ref([
  { id: 1, rackLabel: 'RACK-G01', grid: 'G', minTemp: 19.5, maxTemp: 23.9, avgTemp: 21.7, humidity: 43, outletT: 23.5, status: 'optimal' },
  { id: 2, rackLabel: 'RACK-H02', grid: 'H', minTemp: 20.8, maxTemp: 25.1, avgTemp: 22.9, humidity: 47, outletT: 24.8, status: 'good' },
  { id: 3, rackLabel: 'RACK-I03', grid: 'I', minTemp: 21.6, maxTemp: 26.3, avgTemp: 23.9, humidity: 51, outletT: 26.1, status: 'warning' },
  { id: 4, rackLabel: 'RACK-J04', grid: 'J', minTemp: 18.9, maxTemp: 23.7, avgTemp: 21.3, humidity: 41, outletT: 23.2, status: 'optimal' },
  { id: 5, rackLabel: 'RACK-K05', grid: 'K', minTemp: 22.7, maxTemp: 27.1, avgTemp: 24.9, humidity: 54, outletT: 27.8, status: 'critical' },
  { id: 6, rackLabel: 'RACK-L06', grid: 'L', minTemp: 20.2, maxTemp: 25.0, avgTemp: 22.6, humidity: 45, outletT: 24.6, status: 'good' }
])

// DFM1 - Power data
const powerData = ref([
  { id: 1, circuit: 'PDU-01', rack: 'RACK-A01', grid: 'A', voltage: 208, current: 15.2, power: 3.2, load: 85, pue: 1.45, status: 'good', energy: 24 },
  { id: 2, circuit: 'PDU-02', rack: 'RACK-B02', grid: 'B', voltage: 208, current: 13.8, power: 2.9, load: 72, pue: 1.38, status: 'good', energy: 21 },
  { id: 3, circuit: 'PDU-03', rack: 'RACK-C03', grid: 'C', voltage: 208, current: 2.1, power: 0.4, load: 15, pue: 1.25, status: 'maintenance', energy: 8 },
  { id: 4, circuit: 'PDU-04', rack: 'RACK-D04', grid: 'D', voltage: 208, current: 19.7, power: 4.1, load: 92, pue: 1.52, status: 'warning', energy: 28 },
  { id: 5, circuit: 'PDU-05', rack: 'RACK-E05', grid: 'E', voltage: 208, current: 17.8, power: 3.7, load: 78, pue: 1.48, status: 'good', energy: 25 },
  { id: 6, circuit: 'PDU-06', rack: 'RACK-F06', grid: 'F', voltage: 208, current: 14.0, power: 2.9, load: 65, pue: 1.35, status: 'good', energy: 22 },
  { id: 7, circuit: 'PDU-07', rack: 'RACK-A01', grid: 'A', voltage: 208, current: 16.8, power: 3.5, load: 88, pue: 1.42, status: 'good', energy: 26 },
  { id: 8, circuit: 'PDU-08', rack: 'RACK-B02', grid: 'B', voltage: 208, current: 1.0, power: 0.2, load: 5, pue: 1.15, status: 'inactive', energy: 9 }
])

// DFM2 - Power data
const powerDataB = ref([
  { id: 1, circuit: 'PDU-G01', rack: 'RACK-G01', grid: 'G', voltage: 208, current: 14.8, power: 3.1, load: 83, pue: 1.43, status: 'good', energy: 23 },
  { id: 2, circuit: 'PDU-H02', rack: 'RACK-H02', grid: 'H', voltage: 208, current: 13.2, power: 2.7, load: 70, pue: 1.36, status: 'good', energy: 20 },
  { id: 3, circuit: 'PDU-I03', rack: 'RACK-I03', grid: 'I', voltage: 208, current: 2.3, power: 0.5, load: 18, pue: 1.22, status: 'maintenance', energy: 7 },
  { id: 4, circuit: 'PDU-J04', rack: 'RACK-J04', grid: 'J', voltage: 208, current: 18.9, power: 3.9, load: 89, pue: 1.51, status: 'warning', energy: 27 },
  { id: 5, circuit: 'PDU-K05', rack: 'RACK-K05', grid: 'K', voltage: 208, current: 16.5, power: 3.4, load: 75, pue: 1.46, status: 'good', energy: 24 },
  { id: 6, circuit: 'PDU-L06', rack: 'RACK-L06', grid: 'L', voltage: 208, current: 13.8, power: 2.9, load: 63, pue: 1.33, status: 'good', energy: 21 },
  { id: 7, circuit: 'PDU-M07', rack: 'RACK-G01', grid: 'G', voltage: 208, current: 15.9, power: 3.3, load: 85, pue: 1.40, status: 'good', energy: 25 },
  { id: 8, circuit: 'PDU-N08', rack: 'RACK-H02', grid: 'H', voltage: 208, current: 1.2, power: 0.3, load: 7, pue: 1.12, status: 'inactive', energy: 8 }
])

// DFM1 - Capacity data
const capacityData = ref([
  { id: 1, resource: 'Rack Space', rack: 'RACK-A01', grid: 'A', used: 68, total: 80, unit: 'U', utilization: 85, status: 'good', maxPower: 80 },
  { id: 2, resource: 'Power Capacity', rack: 'RACK-B02', grid: 'B', used: 24.5, total: 40, unit: 'kW', utilization: 61, status: 'good', maxPower: 40 },
  { id: 3, resource: 'Cooling Capacity', rack: 'RACK-C03', grid: 'C', used: 85, total: 100, unit: 'tons', utilization: 85, status: 'warning', maxPower: 100 },
  { id: 4, resource: 'Network Ports', rack: 'RACK-D04', grid: 'D', used: 156, total: 200, unit: 'ports', utilization: 78, status: 'good', maxPower: 200 },
  { id: 5, resource: 'Storage', rack: 'RACK-E05', grid: 'E', used: 45, total: 60, unit: 'TB', utilization: 75, status: 'good', maxPower: 60 },
  { id: 6, resource: 'Bandwidth', rack: 'RACK-F06', grid: 'F', used: 780, total: 1000, unit: 'Mbps', utilization: 78, status: 'good', maxPower: 1000 }
])

// DFM2 - Capacity data
const capacityDataB = ref([
  { id: 1, resource: 'Rack Space', rack: 'RACK-G01', grid: 'G', used: 64, total: 80, unit: 'U', utilization: 80, status: 'good', maxPower: 80 },
  { id: 2, resource: 'Power Capacity', rack: 'RACK-H02', grid: 'H', used: 22.8, total: 40, unit: 'kW', utilization: 57, status: 'good', maxPower: 40 },
  { id: 3, resource: 'Cooling Capacity', rack: 'RACK-I03', grid: 'I', used: 78, total: 100, unit: 'tons', utilization: 78, status: 'good', maxPower: 100 },
  { id: 4, resource: 'Network Ports', rack: 'RACK-J04', grid: 'J', used: 142, total: 200, unit: 'ports', utilization: 71, status: 'good', maxPower: 200 },
  { id: 5, resource: 'Storage', rack: 'RACK-K05', grid: 'K', used: 38, total: 60, unit: 'TB', utilization: 63, status: 'good', maxPower: 60 },
  { id: 6, resource: 'Bandwidth', rack: 'RACK-L06', grid: 'L', used: 720, total: 1000, unit: 'Mbps', utilization: 72, status: 'good', maxPower: 1000 }
])

// DFM2 - Cooling data
const coolingDataB = ref([
  { id: 1, resource: 'Cooling Unit 1', rack: 'RACK-G01', grid: 'G', used: 45, total: 60, unit: 'kW', utilization: 75, status: 'good', maxPower: 60 },
  { id: 2, resource: 'Cooling Unit 2', rack: 'RACK-H02', grid: 'H', used: 38, total: 55, unit: 'kW', utilization: 69, status: 'good', maxPower: 55 },
  { id: 3, resource: 'Cooling Unit 3', rack: 'RACK-I03', grid: 'I', used: 52, total: 70, unit: 'kW', utilization: 74, status: 'warning', maxPower: 70 },
  { id: 4, resource: 'Cooling Unit 4', rack: 'RACK-J04', grid: 'J', used: 42, total: 60, unit: 'kW', utilization: 70, status: 'good', maxPower: 60 },
  { id: 5, resource: 'Cooling Unit 5', rack: 'RACK-K05', grid: 'K', used: 48, total: 65, unit: 'kW', utilization: 74, status: 'good', maxPower: 65 },
  { id: 6, resource: 'Cooling Unit 6', rack: 'RACK-L06', grid: 'L', used: 40, total: 58, unit: 'kW', utilization: 69, status: 'good', maxPower: 58 }
])

// Site-level data for Estate Level view
const siteThermalData = ref([
  { id: 1, site: 'Data Center 1', avgTemp: 22.3, minTemp: 20.1, maxTemp: 24.8, humidity: 45, outletTemp: 24.2, status: 'optimal', compliance: 'optimal' },
  { id: 2, site: 'Data Center 2', avgTemp: 23.1, minTemp: 21.2, maxTemp: 25.5, humidity: 48, outletTemp: 25.1, status: 'good', compliance: 'good' },
  { id: 3, site: 'Data Center 3', avgTemp: 21.8, minTemp: 19.5, maxTemp: 24.2, humidity: 42, outletTemp: 23.8, status: 'optimal', compliance: 'optimal' },
  { id: 4, site: 'Remote Site', avgTemp: 24.2, minTemp: 22.1, maxTemp: 26.8, humidity: 52, outletTemp: 26.1, status: 'warning', compliance: 'warning' }
])

const sitePowerData = ref([
  { id: 1, site: 'Data Center 1', totalPower: 45.2, avgPower: 42.8, peakPower: 48.1, utilization: 85, pue: 1.42, status: 'good', voltage: 415, current: 98, energy: 1080 },
  { id: 2, site: 'Data Center 2', totalPower: 38.7, avgPower: 36.2, peakPower: 41.5, utilization: 78, pue: 1.38, status: 'good', voltage: 413, current: 86, energy: 930 },
  { id: 3, site: 'Data Center 3', totalPower: 52.1, avgPower: 48.9, peakPower: 55.3, utilization: 92, pue: 1.48, status: 'warning', voltage: 418, current: 112, energy: 1240 },
  { id: 4, site: 'Remote Site', totalPower: 41.3, avgPower: 39.1, peakPower: 44.2, utilization: 81, pue: 1.35, status: 'good', voltage: 410, current: 90, energy: 990 }
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
  { id: 1, room: 'Floor 1', totalPower: 45.2, avgPower: 42.8, peakPower: 48.1, utilization: 85, pue: 1.44, status: 'good', voltage: 208, current: 102, energy: 240 },
  { id: 2, room: 'Floor 2', totalPower: 38.7, avgPower: 36.2, peakPower: 41.5, utilization: 78, pue: 1.39, status: 'good', voltage: 208, current: 88, energy: 210 },
  { id: 3, room: 'Floor 3', totalPower: 52.1, avgPower: 48.9, peakPower: 55.3, utilization: 92, pue: 1.47, status: 'warning', voltage: 208, current: 118, energy: 275 },
  { id: 4, room: 'Floor 4', totalPower: 41.3, avgPower: 39.1, peakPower: 44.2, utilization: 81, pue: 1.36, status: 'good', voltage: 208, current: 94, energy: 225 },
  { id: 5, room: 'Floor 5', totalPower: 47.8, avgPower: 44.6, peakPower: 51.2, utilization: 88, pue: 1.41, status: 'good', voltage: 208, current: 108, energy: 260 }
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

const modalAxis = computed(() => {
  const units = selectedGraphData.value.map(series => series.unit).filter(u => u !== undefined && u !== null)
  const primary = units[0] || ''
  const secondary = units.find(u => u !== primary) || ''
  const primaryValues = selectedGraphData.value
    .filter(series => series.unit === primary)
    .flatMap(series => series.points.map(p => p.value))
  const secondaryValues = selectedGraphData.value
    .filter(series => series.unit === secondary)
    .flatMap(series => series.points.map(p => p.value))
  const primaryMax = primaryValues.length ? Math.max(...primaryValues) : 1
  const secondaryMax = secondaryValues.length ? Math.max(...secondaryValues) : 1
  return { primary, secondary, primaryMax: primaryMax || 1, secondaryMax: secondary ? (secondaryMax || 1) : 0 }
})

const getModalPoints = (series: GraphSeries) => {
  if (!series.points.length) return []
  const { primary, primaryMax, secondary, secondaryMax } = modalAxis.value
  const useSecondary = secondary && series.unit === secondary
  const max = useSecondary ? secondaryMax || 1 : primaryMax || 1
  const len = series.points.length
  return series.points.map((point, index) => {
    const x = 60 + (index * 720 / Math.max(len - 1, 1))
    const y = 360 - ((point.value / max) * 320)
    return { x, y }
  })
}

const clearFilters = () => {
  searchTerm.value = ''
  searchTerm2.value = ''
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

const getResolutionMinutes = () => {
  const selected = selectedDataResolution.value[0] || 'Hourly aggregate'
  switch (selected) {
    case '5 min aggregate':
      return 5
    case '15 min aggregate':
      return 15
    case 'Hourly aggregate':
      return 60
    case 'Daily':
    default:
      return 24 * 60
  }
}

const formatTimestamp = (date: Date, minutesStep: number) => {
  const base = toDateInputValue(date)
  if (minutesStep >= 24 * 60) return base
  const hours = `${date.getHours()}`.padStart(2, '0')
  const mins = `${date.getMinutes()}`.padStart(2, '0')
  return `${base} ${hours}:${mins}`
}

const getSelectedTimeline = () => {
  const today = new Date()
  const parseDate = (value: string) => {
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }
  
  const startProvided = !!dateRange.value.start
  const endProvided = !!dateRange.value.end
  
  let end = parseDate(dateRange.value.end) || new Date(today)
  let start = parseDate(dateRange.value.start) || new Date(end)
  
  if (startProvided && !endProvided) {
    end = new Date(start)
    end.setDate(start.getDate() + 6)
  }
  
  // Default to the last 7 days when no start date is supplied
  if (!dateRange.value.start) {
    start.setDate(end.getDate() - 6)
  }
  
  // Normalize time and ensure order
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 0, 0)
  if (start > end) {
    const temp = new Date(start)
    start = end
    end = temp
  }
  
  const minutesStep = getResolutionMinutes()
  const timestamps: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    timestamps.push(formatTimestamp(cursor, minutesStep))
    cursor.setMinutes(cursor.getMinutes() + minutesStep)
  }
  
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
    timestamps,
    minutesStep
  }
}

const getDisplayedTableData = (tabValue = activeTab.value) => {
  const level = selectedAggregateLevel.value
  const byLevel = <T>(estate: T[], site: T[], room: T[]): T[] => {
    if (level === 'Estate Level') return estate
    if (level === 'Site Level') return site
    return room
  }
  
  switch (tabValue) {
    case 'thermal':
      return byLevel(siteThermalData.value as any, roomThermalData.value as any, thermalData.value)
    case 'power':
      return byLevel(sitePowerData.value as any, roomPowerData.value as any, powerData.value)
    case 'capacity':
      return byLevel(siteCapacityData.value as any, roomCapacityData.value as any, capacityData.value)
    default:
      return []
  }
}

const getDisplayedTableDataB = (tabValue = activeTabB.value) => {
  switch (tabValue) {
    case 'thermal':
      return thermalDataB.value
    case 'power':
      return powerDataB.value
    case 'capacity':
      return capacityDataB.value
    case 'cooling':
      return coolingDataB.value
    default:
      return []
  }
}

const stableJitter = (seed: string, magnitude: number) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  const normalized = (hash % 2000) / 2000 - 0.5 // [-0.5, 0.5)
  return normalized * magnitude
}

const getItemLabel = (item: any) => item.rackLabel || item.rack || item.room || item.site || item.resource || item.circuit || 'Item'

const getTimeSeriesFields = (tabValue: string) => {
  if (tabValue === 'thermal') {
    return [
      { label: 'Min Temp', unit: '°C', getBase: (item: any) => Number(item.minTemp ?? item.avgTemp ?? 0) },
      { label: 'Max Temp', unit: '°C', getBase: (item: any) => Number(item.maxTemp ?? item.avgTemp ?? 0) },
      { label: 'Avg Temp', unit: '°C', getBase: (item: any) => Number(item.avgTemp ?? ((Number(item.minTemp) || 0 + Number(item.maxTemp) || 0) / 2)) },
      { label: 'Humidity', unit: '%', getBase: (item: any) => Number(item.humidity ?? 0) },
      { label: 'Dew Point', unit: '°C', getBase: (item: any) => Number(item.dewPoint ?? (Number(item.avgTemp ?? 0) - 3)) },
      { label: 'Outlet T', unit: '°C', getBase: (item: any) => Number(item.outletT ?? item.outletTemp ?? item.avgTemp ?? 0) }
    ]
  }
  if (tabValue === 'power') {
    return [
      { label: 'Voltage', unit: 'V', getBase: (item: any) => Number(item.voltage ?? 230) },
      { label: 'Current', unit: 'A', getBase: (item: any) => Number(item.current ?? 15) },
      { label: 'Power', unit: 'kW', getBase: (item: any) => Number(item.totalPower ?? item.power ?? item.avgPower ?? 0) },
      { label: 'Energy', unit: 'kWh', getBase: (item: any) => Number(item.energy ?? 0) },
      { label: 'Load', unit: '%', getBase: (item: any) => Number(item.load ?? item.utilization ?? 0) },
      { label: 'PUE', unit: '', getBase: (item: any) => Number(item.pue ?? 1.4) }
    ]
  }
  if (tabValue === 'capacity') {
    return [
      { label: 'Measured', unit: (item: any) => item.unit || 'kW', getBase: (item: any) => Number(item.used ?? 0) },
      { label: 'Allocated', unit: (item: any) => item.unit || 'kW', getBase: (item: any) => Number(Math.max((Number(item.used) || 0) * 0.9, 0)) },
      { label: 'Reserved', unit: (item: any) => item.unit || 'kW', getBase: (item: any) => Number((Number(item.total) || 0) - (Number(item.used) || 0)) },
      { label: 'Subtotal', unit: (item: any) => item.unit || 'kW', getBase: (item: any) => Number(item.total ?? 0) },
      { label: 'Utilization', unit: '%', getBase: (item: any) => Number(item.utilization ?? ((Number(item.used) || 0) / Math.max(Number(item.total) || 1, 1)) * 100) }
    ]
  }
  if (tabValue === 'cooling') {
    return [
      { label: 'Cooling Used', unit: (item: any) => item.unit || 'kW', getBase: (item: any) => Number(item.used ?? 0) },
      { label: 'Cooling Total', unit: (item: any) => item.unit || 'kW', getBase: (item: any) => Number(item.total ?? 0) },
      { label: 'Cooling Utilization', unit: '%', getBase: (item: any) => Number(item.utilization ?? ((Number(item.used) || 0) / Math.max(Number(item.total) || 1, 1)) * 100) }
    ]
  }
  return [
    { label: 'Value', unit: '', getBase: (item: any) => Number(item.value ?? 0) }
  ]
}

const formatTimeSeriesValue = (field: any, item: any, tabValue: string, timestamp: string) => {
  const base = field.getBase(item) || 0
  const label = getItemLabel(item)
  const jitter = Math.max(Math.abs(base) * 0.05, 0.5)
  const value = Math.max(0, base + stableJitter(`${field.label}-${label}-${timestamp}-${tabValue}`, jitter))
  const unit = typeof field.unit === 'function' ? field.unit(item) : field.unit
  const num = parseFloat(value.toFixed(2))
  return unit ? `${num} ${unit}` : `${num}`
}

const buildTimeSeriesCsv = (tabValue = activeTab.value, isB = false) => {
  const dataset = isB ? getDisplayedTableDataB(tabValue) : getDisplayedTableData(tabValue)
  const { timestamps, start, end } = getSelectedTimeline()
  if (!dataset.length || !timestamps.length) {
    return { csv: '', range: `${start} to ${end}` }
  }
  const fields = getTimeSeriesFields(tabValue)
  
  const header = ['Item', 'Timestamp', ...fields.map(field => field.label)]
  const rows: (string | number)[][] = [header]
  const ordered = [...dataset].sort((a: any, b: any) => {
    const aLabel = getItemLabel(a).toString()
    const bLabel = getItemLabel(b).toString()
    return aLabel.localeCompare(bLabel)
  })
  
  ordered.forEach(item => {
    timestamps.forEach(timestamp => {
      rows.push([
        getItemLabel(item),
        timestamp,
        ...fields.map(field => formatTimeSeriesValue(field, item, tabValue, timestamp))
      ])
    })
    rows.push(['', '', ...fields.map(() => '')]) // spacer row for grouping
  })
  
  const csv = rows.map(row => row.join(',')).join('\n')
  return { csv, range: `${start} to ${end}` }
}

const getCurrentTableData = () => getDisplayedTableData()

const exportToCSV = () => {
  const { csv, range } = buildTimeSeriesCsv(activeTab.value, false)
  if (!csv) return
  
  csvModalTitle.value = `${activeTab.value.toUpperCase()} Time Series (${range})`
  csvModalContent.value = csv
  showCsvModal.value = true
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

// DFM2 Export functionality
const toggleExportDropdownB = () => {
  exportDropdownOpenB.value = !exportDropdownOpenB.value
}

const getCurrentTableDataB = () => getDisplayedTableDataB()

const exportToCSVB = () => {
  const { csv, range } = buildTimeSeriesCsv(activeTabB.value, true)
  if (!csv) return
  
  csvModalTitle.value = `CAGE B ${activeTabB.value.toUpperCase()} Time Series (${range})`
  csvModalContent.value = csv
  showCsvModal.value = true
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
          <title>DFM2 - ${activeTabB.value.charAt(0).toUpperCase() + activeTabB.value.slice(1)} Data Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>DFM2 - ${activeTabB.value.charAt(0).toUpperCase() + activeTabB.value.slice(1)} Data Export</h1>
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
  
  csvModalTitle.value = `CHART ${selectedChartDatatype.value.toUpperCase()} CSV Preview`
  csvModalContent.value = csvContent
  showCsvModal.value = true
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

const closeCsvModal = () => {
  showCsvModal.value = false
  csvModalContent.value = ''
  csvModalTitle.value = ''
}


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
          <template v-if="topSummaryCards.length">
            <div class="header-stat" v-for="card in topSummaryCards" :key="card.label">
              <span class="header-stat-label">{{ card.label }}</span>
              <span class="header-stat-value">{{ card.value }}</span>
              <span v-if="card.rack" class="header-stat-rack">{{ card.rack }}</span>
            </div>
          </template>
          <template v-else>
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
          </template>
        </div>
      </div>
    </header>

    <!-- Dashboard Content -->
    <div class="dashboard-content">
      <!-- Left Sidebar Header -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1>Custom Report & Dashboard</h1>
          <p class="sidebar-subtitle">Monitor rack group performance by cage across rooms on different sites e.g. BT as a Colo</p>
        </div>
        
        <!-- Filters in Sidebar -->
        <div class="sidebar-filters">
          <div class="filter-group">
            <label>View</label>
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
            <label>Customer</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('customer')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.customer }"
              >
                {{ getDropdownLabel('customer', selectedCustomer, ['KPMG', 'Tesco', 'BT', 'ServiceNow', 'Citi Bank', 'Microsoft']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.customer" class="dropdown-content">
                <label v-for="option in ['KPMG', 'Tesco', 'BT', 'ServiceNow', 'Citi Bank', 'Microsoft']" :key="option" class="checkbox-item">
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
            <label for="search2">Search by Custom Reference 2</label>
            <input
              id="search2"
              v-model="searchTerm2"
              type="text"
              placeholder="Search by custom reference..."
              class="filter-input"
            />
          </div>
          
          <div v-if="selectedAggregateLevel === 'Estate Level' || selectedAggregateLevel === 'Site Level' || selectedAggregateLevel === 'Room Level'" class="filter-group">
            <label>Site</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('site')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.site }"
              >
                {{ getDropdownLabel('site', selectedSite, ['All Sites', 'TH North', 'TH South', 'TH East']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.site" class="dropdown-content">
                <label v-for="option in ['All Sites', 'TH North', 'TH South', 'TH East']" :key="option" class="checkbox-item">
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
                {{ getDropdownLabel('room', selectedRoom, ['All Rooms', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6', 'Floor 7']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.room" class="dropdown-content">
                <label v-for="option in ['All Rooms', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6', 'Floor 7']" :key="option" class="checkbox-item">
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
          <label v-if="selectedAggregateLevel === 'Site Level' || selectedAggregateLevel === 'Room Level'" class="checkbox-inline">
            <input 
              type="checkbox" 
              v-model="showSiteItems"
            />
            <span class="checkbox-label">Show Site items too?</span>
          </label>
          </div>
          
          <div v-if="selectedAggregateLevel === 'Room Level'" class="filter-group">
            <label>Cage/Rack Group</label>
            <div class="dropdown-checkbox">
              <button 
                @click="toggleDropdown('cage')" 
                class="dropdown-button"
                :class="{ 'active': dropdownOpen.cage }"
              >
                {{ getDropdownLabel('cage', selectedCage, ['All Rack Groups', 'DFM1', 'DFM2', 'DFM3', 'Rack Group 1', 'Rack Group 2']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.cage" class="dropdown-content">
                <label v-for="option in ['All Rack Groups', 'DFM1', 'DFM2', 'DFM3', 'Rack Group 1', 'Rack Group 2']" :key="option" class="checkbox-item">
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
                {{ getDropdownLabel('itemType', selectedItemType, itemTypeOptions) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.itemType" class="dropdown-content">
                <label v-for="option in itemTypeRadioOptions" :key="option" class="checkbox-item">
                  <input 
                    type="radio" 
                    name="item-type"
                    :value="option" 
                    :checked="(option === 'All Item Types' && selectedItemType.length === 0) || selectedItemType.includes(option)"
                    @change="selectItemType(option)"
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
              placeholder="e.g. DFM D10 D07"
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
                {{ getDropdownLabel('summaryDatatype', selectedSummaryDatatype, ['Power', 'PUE','Temperature', 'Humidity', 'Voltage', 'Amps','Energy','Compliance']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.summaryDatatype" class="dropdown-content">
                <label v-for="option in ['Power', 'Temperature', 'Humidity', 'Voltage', 'Amps','Energy','Compliance']" :key="option" class="checkbox-item">
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
                <div v-if="datatype !== 'Compliance'" class="aggregation-options">
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
                <div v-if="datatype !== 'Compliance'" class="aggregation-options">
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
                {{ getDropdownLabel('powerDatatype', selectedPowerDatatype, ['Power', 'Temperature', 'Humidity', 'Airflow', 'Utilization', 'Dew Point', 'Voltage', 'Amps', 'Outlet T']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.powerDatatype" class="dropdown-content">
                <label v-for="option in ['Power', 'Voltage', 'Amps','Energy']" :key="option" class="checkbox-item">
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
                <div v-if="datatype !== 'Compliance'" class="aggregation-options">
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
                {{ getDropdownLabel('dataResolution', selectedDataResolution, ['5 min aggregate', '15 min aggregate', 'Hourly aggregate', 'Daily']) }}
                <span class="dropdown-arrow">▼</span>
              </button>
              <div v-if="dropdownOpen.dataResolution" class="dropdown-content">
                <label v-for="option in ['5 min aggregate', '15 min aggregate', 'Hourly aggregate', 'Daily']" :key="option" class="checkbox-item">
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
          
          <div class="filter-group">
            <label>Date Range</label>
            <div class="date-presets">
              <button
                v-for="preset in datePresets"
                :key="preset.id"
                class="date-preset-button"
                :class="{ active: activeDatePreset === preset.id }"
                @click="setDatePreset(preset.id)"
              >
                {{ preset.label }}
              </button>
              <button class="date-preset-button clear" @click="clearDateRange">
                Clear
              </button>
            </div>
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
          
          <button @click="clearFilters" class="clear-filters-btn">
            Search
          </button>
        </div>
        
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Cage/rack Group Header -->
        <div class="cage-group-header">
          <h2 class="cage-group-title">{{ bannerTitle }}</h2>
          <p class="cage-group-subtitle">{{ bannerSubtitle }}</p>
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
          v-for="tab in filteredTabs" 
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
                <tr v-if="selectedAggregateLevel === 'Estate Level'" class="subtotal-row">
                  <td class="name-cell subtotal-label">Subtotal</td>
                  <td class="name-cell">-</td>
                  <td v-if="showThermalColumns.temperature" class="value-cell">
                    <div class="temp-range">
                      <span class="temp-min">{{ thermalTableSubtotal.minTemp.toFixed(1) }}°C</span>
                      <span class="temp-separator">-</span>
                      <span class="temp-max">{{ thermalTableSubtotal.maxTemp.toFixed(1) }}°C</span>
                    </div>
                  </td>
                  <td v-if="showThermalColumns.temperature" class="value-cell">{{ thermalTableSubtotal.avgTemp.toFixed(1) }}°C</td>
                  <td v-if="showThermalColumns.humidity" class="value-cell">{{ thermalTableSubtotal.humidity.toFixed(1) }}%</td>
                  <td v-if="showThermalColumns.dewPoint" class="value-cell">N/A</td>
                  <td v-if="showThermalColumns.outletT" class="value-cell">{{ thermalTableSubtotal.outlet.toFixed(1) }}°C</td>
                  <td v-if="showThermalColumns.compliance" class="status-cell">-</td>
                  <td class="action-cell">-</td>
                </tr>
                <tr v-else-if="selectedAggregateLevel === 'Site Level'" class="subtotal-row">
                  <td class="name-cell subtotal-label">Subtotal</td>
                  <td class="name-cell">-</td>
                  <td v-if="showThermalColumns.temperature" class="value-cell">
                    <div class="temp-range">
                      <span class="temp-min">{{ thermalTableSubtotal.minTemp.toFixed(1) }}°C</span>
                      <span class="temp-separator">-</span>
                      <span class="temp-max">{{ thermalTableSubtotal.maxTemp.toFixed(1) }}°C</span>
                    </div>
                  </td>
                  <td v-if="showThermalColumns.temperature" class="value-cell">{{ thermalTableSubtotal.avgTemp.toFixed(1) }}°C</td>
                  <td v-if="showThermalColumns.humidity" class="value-cell">{{ thermalTableSubtotal.humidity.toFixed(1) }}%</td>
                  <td v-if="showThermalColumns.dewPoint" class="value-cell">N/A</td>
                  <td v-if="showThermalColumns.outletT" class="value-cell">{{ thermalTableSubtotal.outlet.toFixed(1) }}°C</td>
                  <td v-if="showThermalColumns.compliance" class="status-cell">-</td>
                  <td class="action-cell">-</td>
                </tr>
                <tr v-else class="subtotal-row">
                  <td class="name-cell subtotal-label">Subtotal</td>
                  <td class="name-cell">-</td>
                  <td v-if="showThermalColumns.temperature" class="value-cell">
                    <div class="temp-range">
                      <span class="temp-min">{{ thermalTableSubtotal.minTemp.toFixed(1) }}°C</span>
                      <span class="temp-separator">-</span>
                      <span class="temp-max">{{ thermalTableSubtotal.maxTemp.toFixed(1) }}°C</span>
                    </div>
                  </td>
                  <td v-if="showThermalColumns.temperature" class="value-cell">{{ thermalTableSubtotal.avgTemp.toFixed(1) }}°C</td>
                  <td v-if="showThermalColumns.humidity" class="value-cell">{{ thermalTableSubtotal.humidity.toFixed(1) }}%</td>
                  <td v-if="showThermalColumns.dewPoint" class="value-cell">N/A</td>
                  <td v-if="showThermalColumns.outletT" class="value-cell">{{ thermalTableSubtotal.outlet.toFixed(1) }}°C</td>
                  <td v-if="showThermalColumns.compliance" class="status-cell">-</td>
                  <td class="action-cell">-</td>
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
                  <th>{{ powerPrimaryHeader }}</th>
                  <th>{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Grid' }}</th>
                  <th v-if="showPowerColumns.voltage">{{ selectedAggregateLevel === 'Estate Level' ? 'Voltage' : selectedAggregateLevel === 'Site Level' ? 'Voltage' : 'Voltage' }}</th>
                  <th v-if="showPowerColumns.amps">{{ selectedAggregateLevel === 'Estate Level' ? 'Current' : selectedAggregateLevel === 'Site Level' ? 'Current' : 'Current' }}</th>
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
                    <td class="name-cell">-</td>
                    <td v-if="showPowerColumns.voltage" class="value-cell">{{ site.voltage }}V</td>
                    <td v-if="showPowerColumns.amps" class="value-cell">{{ site.current }}A</td>
                    <td v-if="showPowerColumns.power" class="value-cell">{{ site.totalPower }}kW</td>
                    <td v-if="showPowerColumns.energy" class="value-cell">{{ formatKwh(site.energy) }}</td>
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
                    <td class="name-cell">-</td>
                    <td v-if="showPowerColumns.voltage" class="value-cell">{{ room.voltage }}V</td>
                    <td v-if="showPowerColumns.amps" class="value-cell">{{ room.current }}A</td>
                    <td v-if="showPowerColumns.power" class="value-cell">{{ room.totalPower }}kW</td>
                    <td v-if="showPowerColumns.energy" class="value-cell">{{ formatKwh(room.energy) }}</td>
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
                  <td class="name-cell">{{ powerRowLabel(power) }}</td>
                  <td class="name-cell">{{ power.grid }}</td>
                  <td v-if="showPowerColumns.voltage" class="value-cell">{{ power.voltage }}V</td>
                  <td v-if="showPowerColumns.amps" class="value-cell">{{ power.current }}A</td>
                  <td v-if="showPowerColumns.power" class="value-cell">{{ power.power }}kW</td>
                  <td v-if="showPowerColumns.energy" class="value-cell">{{ formatKwh(power.energy) }}</td>
                    <td class="action-cell">
                      <button @click="showGraph(power, 'power')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                  </td>
                </tr>
                </template>
                <tr class="subtotal-row">
                  <td class="name-cell subtotal-label">Subtotal</td>
                  <td class="name-cell">-</td>
                  <td v-if="showPowerColumns.voltage" class="value-cell">{{ powerTableSubtotal.voltage.toFixed(1) }}V</td>
                  <td v-if="showPowerColumns.amps" class="value-cell">{{ powerTableSubtotal.current.toFixed(1) }}A</td>
                  <td v-if="showPowerColumns.power" class="value-cell">{{ powerTableSubtotal.power }}</td>
                  <td v-if="showPowerColumns.energy" class="value-cell">{{ powerTableSubtotal.energy }}</td>
                  <td class="action-cell">-</td>
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
                  <th>{{ capacityPrimaryHeader }}</th>
                  <th>{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Grid' }}</th>
                  <th v-if="showCapacityColumns.measured">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Measured (kW)' }}</th>
                  <th v-if="showCapacityColumns.allocated">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Allocated (kW)' }}</th>
                  <th v-if="showCapacityColumns.reserved">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Reserved (kW)' }}</th>
                  <th v-if="selectedAggregateLevel === 'Room Level'">Subtotal (kW)</th>
                  <th v-if="showCapacityColumns.space">{{ selectedAggregateLevel === 'Estate Level' ? '-' : selectedAggregateLevel === 'Site Level' ? '-' : 'Space' }}</th>
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
                    <td class="value-cell">{{ site.availableRacks }} racks</td>
                    <td class="value-cell">{{ site.utilization }}%</td>
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
                    <td class="value-cell">{{ room.availableRacks }} racks</td>
                    <td class="value-cell">{{ room.utilization }}%</td>
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
                    <td class="name-cell">{{ capacityRowLabel(capacity) }}</td>
                    <td class="name-cell">{{ capacity.grid }}</td>
                  <td class="value-cell">{{ formatKw(capacity.used) }}</td>
                  <td class="value-cell">{{ formatKw(Math.max(capacity.used * 0.9, 0)) }}</td>
                  <td v-if="showCapacityColumns.reserved" class="value-cell">{{ formatKw(capacity.total - capacity.used) }}</td>
                  <td v-if="selectedAggregateLevel === 'Room Level'" class="value-cell">{{ formatKw(capacity.total) }}</td>
                  <td v-if="showCapacityColumns.space" class="value-cell">{{ capacity.utilization }}%</td>
                    <td class="action-cell">
                      <button @click="showGraph(capacity, 'capacity')" class="graph-btn" title="View Time Series Graph">
                        📊
                      </button>
                  </td>
                </tr>
                </template>
                <tr class="subtotal-row">
                  <td class="name-cell subtotal-label">Subtotal</td>
                  <td class="name-cell">-</td>
                  <td v-if="showCapacityColumns.measured" class="value-cell">
                    <template v-if="selectedAggregateLevel === 'Room Level'">
                      {{ formatKw(capacityTableSubtotal.measured) }}
                    </template>
                    <template v-else>
                      {{ capacityTableSubtotal.measured }} racks
                    </template>
                  </td>
                  <td v-if="showCapacityColumns.allocated" class="value-cell">
                    <template v-if="selectedAggregateLevel === 'Room Level'">
                      {{ formatKw(capacityTableSubtotal.allocated) }}
                    </template>
                    <template v-else>
                      {{ capacityTableSubtotal.allocated }} racks
                    </template>
                  </td>
                  <td v-if="showCapacityColumns.reserved" class="value-cell">
                    <template v-if="selectedAggregateLevel === 'Room Level'">
                      {{ formatKw(capacityTableSubtotal.reserved) }}
                    </template>
                    <template v-else>
                      {{ capacityTableSubtotal.reserved }} racks
                    </template>
                  </td>
                  <td v-if="selectedAggregateLevel === 'Room Level'" class="value-cell">{{ formatKw(capacityTableSubtotal.subtotal) }}</td>
                  <td v-if="showCapacityColumns.space" class="value-cell">{{ capacityTableSubtotal.utilization.toFixed(1) }}%</td>
                  <td class="action-cell">-</td>
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
          Export Data (time series for all racks)
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

    <!-- DFM2 Section -->
    <div class="cage-group-header">
      <h2 class="cage-group-title">DFM2 - Rack Group G01-L06</h2>
      <p class="cage-group-subtitle">Monitoring dashboard for racks G01 through L06 in DFM2</p>
    </div>
    
    <!-- DFM2 Chart and Stats Section -->
    <div class="chart-stats-section">
      <!-- DFM2 Chart Section -->
      <div class="chart-section">
        <div class="chart-header">
          <h2 class="chart-title">DFM2 Performance Overview</h2>
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

      <!-- DFM2 Summary Stats Table -->
      <div class="stats-table-section">
        <h3 class="stats-table-title">DFM2 Performance Summary</h3>
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

    <!-- DFM2 Tabbed Tables Container -->
    <div class="tabbed-tables-container">
      <div class="tabs-container">
        <button 
          v-for="tab in tabOptionsB"
          :key="tab.id"
          @click="activeTabB = tab.id" 
          :class="['tab-button', { 'active': activeTabB === tab.id }]"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div class="tab-content">
        <!-- DFM2 Thermal Tab -->
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
                <tr class="subtotal-row">
                  <td class="name-cell subtotal-label">Subtotal</td>
                  <td class="name-cell">-</td>
                  <td class="value-cell">
                    <div class="temp-range">
                      <span class="temp-min">{{ thermalTableSubtotalB.minTemp.toFixed(1) }}°C</span>
                      <span class="temp-separator">-</span>
                      <span class="temp-max">{{ thermalTableSubtotalB.maxTemp.toFixed(1) }}°C</span>
                    </div>
                  </td>
                  <td class="value-cell">{{ thermalTableSubtotalB.avgTemp.toFixed(1) }}°C</td>
                  <td class="value-cell">{{ thermalTableSubtotalB.humidity.toFixed(1) }}%</td>
                  <td class="value-cell">{{ thermalTableSubtotalB.outlet.toFixed(1) }}°C</td>
                  <td class="status-cell">-</td>
                  <td class="action-cell">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- DFM2 Power Tab -->
        <div v-if="activeTabB === 'power'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ isPowerItemType ? 'PDU' : 'Rack Label' }}</th>
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
                  <td class="name-cell">{{ powerRowLabelB(power) }}</td>
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
                <tr class="subtotal-row">
                  <td class="name-cell subtotal-label">Subtotal</td>
                  <td class="name-cell">-</td>
                  <td class="value-cell">{{ powerTableSubtotalB.voltage.toFixed(1) }}V</td>
                  <td class="value-cell">{{ powerTableSubtotalB.current.toFixed(1) }}A</td>
                  <td class="value-cell">{{ powerTableSubtotalB.power }}</td>
                  <td class="value-cell">{{ powerTableSubtotalB.load }}</td>
                  <td class="action-cell">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- DFM2 Capacity Tab -->
        <div v-if="activeTabB === 'capacity'" class="tab-panel">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ isPowerItemType ? 'PDU' : 'Rack Label' }}</th>
                  <th>Grid</th>
                  <th>Measured (kW)</th>
                  <th>Allocated (kW)</th>
                  <th>Reserved (kW)</th>
                  <th>Subtotal (kW)</th>
                  <th>Space</th>
                  <th>Graph</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="capacity in capacityDataB" :key="capacity.id" class="data-row">
                  <td class="name-cell">{{ capacityRowLabelB(capacity) }}</td>
                  <td class="name-cell">{{ capacity.grid }}</td>
                  <td class="value-cell">{{ formatKw(capacity.used) }}</td>
                  <td class="value-cell">{{ formatKw(Math.max(capacity.used * 0.9, 0)) }}</td>
                  <td class="value-cell">{{ formatKw(capacity.total - capacity.used) }}</td>
                  <td class="value-cell">{{ formatKw(capacity.total) }}</td>
                  <td class="value-cell">{{ capacity.utilization }}%</td>
                  <td class="action-cell">
                    <button @click="showGraph(capacity, 'capacity')" class="graph-btn" title="View Time Series Graph">
                      📊
                    </button>
                  </td>
                </tr>
                <tr class="subtotal-row">
                  <td class="name-cell subtotal-label">Subtotal</td>
                  <td class="name-cell">-</td>
                  <td class="value-cell">{{ formatKw(capacityTableSubtotalB.measured) }}</td>
                  <td class="value-cell">{{ formatKw(capacityTableSubtotalB.allocated) }}</td>
                  <td class="value-cell">{{ formatKw(capacityTableSubtotalB.reserved) }}</td>
                  <td class="value-cell">{{ formatKw(capacityTableSubtotalB.subtotal) }}</td>
                  <td class="value-cell">{{ capacityTableSubtotalB.utilization.toFixed(1) }}%</td>
                  <td class="action-cell">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- DFM2 Cooling Tab -->
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

    <!-- DFM2 Export Options -->
    <div class="export-section">
      <div class="export-dropdown">
        <button 
          @click="toggleExportDropdownB" 
          class="export-button"
          :class="{ 'active': exportDropdownOpenB }"
        >
          <span class="export-icon">📊</span>
          Export DFM2 Data
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
            <!-- Axes -->
            <line x1="60" y1="360" x2="780" y2="360" stroke="#4b5563" stroke-width="1.5" />
            <line x1="60" y1="40" x2="60" y2="360" stroke="#4b5563" stroke-width="1.5" />
            <line v-if="modalAxis.secondary" x1="780" y1="40" x2="780" y2="360" stroke="#4b5563" stroke-width="1.5" />
            
            <!-- Data lines -->
            <template v-for="series in selectedGraphData" :key="series.label">
              <polyline
                :points="getModalPoints(series).map(pt => `${pt.x},${pt.y}`).join(' ')"
                fill="none"
                :stroke="series.color"
                stroke-width="3"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              <circle
                v-for="(pt, idx) in getModalPoints(series)"
                :key="`${series.label}-pt-${idx}`"
                :cx="pt.x"
                :cy="pt.y"
                r="4"
                :fill="series.color"
                stroke="#0b1220"
                stroke-width="1.5"
              />
            </template>
            
            <!-- X-axis labels (time) -->
            <text
              v-for="(point, index) in (selectedGraphData[0]?.points || []).filter((_, i) => i % 4 === 0)"
              :key="index"
              :x="60 + (index * 4 * 720 / (Math.max((selectedGraphData[0]?.points.length || 1) - 1, 1)))"
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
              {{ (modalAxis.primaryMax * value).toFixed(1) }}
            </text>
            
            <!-- Y-axis unit -->
            <text x="20" y="200" class="y-axis-label" transform="rotate(-90, 20, 200)">
              {{ modalAxis.primary || '' }}
            </text>

            <!-- Right Y-axis labels for secondary unit -->
            <template v-if="modalAxis.secondary">
              <text
                v-for="(value, index) in [0, 0.25, 0.5, 0.75, 1]"
                :key="`right-${index}`"
                x="790"
                :y="360 - (value * 320) + 5"
                class="axis-label"
                text-anchor="start"
              >
                {{ (modalAxis.secondaryMax * value).toFixed(1) }}
              </text>
              <text x="780" y="200" class="y-axis-label" transform="rotate(90, 780, 200)">
                {{ modalAxis.secondary }}
              </text>
            </template>
          </svg>
          <div class="series-legend" v-if="selectedGraphData.length">
            <div class="legend-item" v-for="series in selectedGraphData" :key="series.label">
              <span class="legend-swatch" :style="{ background: series.color }"></span>
              <span class="legend-label">{{ series.label }} ({{ series.unit }})</span>
            </div>
          </div>
        </div>
        <div v-else class="no-data">
          <p>No time series data available</p>
        </div>
      </div>
    </div>
  </div>

  <!-- CSV Preview Modal -->
  <div v-if="showCsvModal" class="modal-overlay" @click="closeCsvModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ csvModalTitle || 'CSV Preview' }}</h3>
        <button @click="closeCsvModal" class="modal-close-btn">×</button>
      </div>
      <div class="modal-body">
        <div v-if="csvPreviewRows.length" class="csv-table-wrapper">
          <table class="csv-table">
            <thead>
              <tr>
                <th v-for="(cell, index) in csvPreviewRows[0]" :key="`head-${index}`">{{ cell }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in csvPreviewRows.slice(1)" :key="`row-${rowIndex}`">
                <td v-for="(cell, cellIndex) in row" :key="`cell-${rowIndex}-${cellIndex}`">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="csv-empty">No data to preview.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

.dashboard {
  --bg: #0b0f17;
  --panel: #0f1521;
  --card: #121a28;
  --card-soft: #162033;
  --text: #e5e9f2;
  --muted: #8fa0bd;
  --border: rgba(143, 160, 189, 0.24);
  --accent: #4f8cff;
  --accent-strong: #3b7bff;
  --accent-warm: #f59e0b;
  --success: #30c48d;
  --warning: #f5b73a;
  --danger: #ef5f5f;
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, rgba(79, 140, 255, 0.08), transparent 28%),
              radial-gradient(circle at 75% 0%, rgba(245, 158, 11, 0.06), transparent 30%),
              linear-gradient(135deg, #0a0f18 0%, #0d1320 50%, #0a0f18 100%);
  display: flex;
  flex-direction: column;
  font-family: 'Space Grotesk', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--text);
}

.top-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(15, 21, 33, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.header-content {
  max-width: 2400px;
  width: 100%;
  margin: 0 auto;
  padding: 1.25rem 3.5rem;
  display: grid;
  grid-template-columns: 1.2fr 2fr;
  gap: 1.5rem;
  align-items: center;
}

.header-left {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  justify-content: space-between;
}

.header-title {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.header-info {
  display: grid;
  gap: 0.25rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.header-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.75rem;
}

.header-stat {
  background: linear-gradient(145deg, #131c2d 0%, #101828 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 0.9rem 1rem;
  display: grid;
  gap: 0.35rem;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.3);
}

.header-stat-label {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--muted);
}

.header-stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.header-stat-rack {
  font-size: 0.75rem;
  color: var(--muted);
}

.dashboard-content {
  display: grid;
  grid-template-columns: 360px 1fr;
  min-height: 0;
  max-width: 2400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1.5rem;
}

.sidebar {
  background: rgba(16, 22, 35, 0.9);
  border-right: 1px solid var(--border);
  padding: 1.75rem 1.5rem;
  position: sticky;
  top: 80px;
  align-self: start;
  height: calc(100vh - 80px);
  overflow-y: auto;
  box-shadow: 10px 0 40px rgba(0, 0, 0, 0.25);
}

.sidebar-header h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.sidebar-subtitle {
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.sidebar-filters {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-top: 1.5rem;
}

.filter-group label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.9rem;
}

.filter-input,
.date-input,
.dropdown-button,
.chart-select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(17, 26, 46, 0.7);
  color: var(--text);
  padding: 0.65rem 0.75rem;
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.filter-input:focus,
.date-input:focus,
.dropdown-button:focus,
.chart-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.15);
}

.dropdown-checkbox {
  position: relative;
}

.dropdown-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: rgba(18, 26, 42, 0.95);
}

.dropdown-arrow,
.export-arrow {
  font-size: 0.8rem;
  color: var(--muted);
}

.dropdown-content {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  padding: 0.5rem;
  z-index: 5;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.5rem;
  border-radius: 8px;
  color: var(--text);
}

.checkbox-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.checkbox-label {
  font-size: 0.95rem;
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--muted);
  font-weight: 600;
  margin-top: 0.35rem;
}

.date-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.6rem;
}

.date-preset-button {
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(17, 26, 46, 0.7);
  color: var(--text);
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, transform 0.1s ease;
}

.date-preset-button:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
}

.date-preset-button.active {
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
  color: #041019;
  border-color: transparent;
  box-shadow: 0 10px 24px rgba(6, 182, 212, 0.22);
}

.date-preset-button.clear {
  background: transparent;
  color: var(--muted);
}

.date-range-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.date-label {
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 0.25rem;
}

.date-input-group {
  display: grid;
}

.selected-datatypes-container {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.selected-datatype-item {
  background: rgba(17, 26, 46, 0.8);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem;
}

.datatype-label {
  font-weight: 700;
  margin-bottom: 0.4rem;
  display: block;
}

.aggregation-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.aggregation-option {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.aggregation-label {
  color: var(--text);
}

.clear-filters-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
  border: none;
  border-radius: 12px;
  color: #041019;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(6, 182, 212, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.clear-filters-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 36px rgba(6, 182, 212, 0.32);
}

.main-content {
  padding: 2.25rem 4.25rem;
  min-width: 0;
}

.cage-group-header {
  background: linear-gradient(140deg, rgba(17, 26, 46, 0.95), rgba(17, 26, 46, 0.7));
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.32);
  margin-bottom: 1.5rem;
}

.cage-group-title {
  margin: 0 0 0.35rem;
  font-size: 1.55rem;
}

.cage-group-subtitle {
  margin: 0;
  color: var(--muted);
}

.chart-stats-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
  margin-bottom: 1.75rem;
}

.chart-section,
.stats-table-section {
  background: linear-gradient(160deg, #121a28 0%, #0f1724 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
}

.chart-section {
  padding: 1.25rem 1.25rem 1.1rem;
}

.stats-table-section {
  padding: 1.25rem;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.chart-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.chart-dropdown {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.chart-dropdown-label {
  color: var(--muted);
  font-weight: 600;
}

.chart-select {
  width: auto;
  min-width: 160px;
}

.chart-container {
  background: radial-gradient(circle at 30% 20%, rgba(79, 140, 255, 0.08), transparent 40%),
              radial-gradient(circle at 80% 0%, rgba(245, 158, 11, 0.06), transparent 35%),
              #0e1726;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 1rem;
}

.line-chart {
  width: 100%;
  height: auto;
}

.data-point {
  transition: transform 0.15s ease, r 0.15s ease;
}

.data-point:hover {
  transform: translateY(-2px);
  r: 5;
}

.value-label,
.date-label,
.y-axis-label {
  fill: var(--muted);
  font-size: 0.75rem;
}

.chart-no-data {
  text-align: center;
  color: var(--muted);
  padding: 2rem 0;
}

.chart-export-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.export-dropdown {
  position: relative;
}

.chart-export-button,
.export-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.chart-export-button:hover,
.export-button:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(34, 211, 238, 0.5);
  transform: translateY(-1px);
}

.chart-export-button.active,
.export-button.active {
  border-color: rgba(34, 211, 238, 0.6);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
}

.export-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
  padding: 0.4rem;
  display: grid;
  gap: 0.25rem;
  min-width: 190px;
  z-index: 6;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text);
  text-align: left;
  padding: 0.6rem 0.7rem;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.export-option:hover {
  background: rgba(255, 255, 255, 0.04);
}

.export-option-icon,
.export-icon {
  opacity: 0.8;
}

.stats-table-title {
  margin: 0 0 0.75rem;
  color: var(--text);
}

.stats-table-container {
  overflow: hidden;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  padding: 0.65rem 0.25rem;
}

.stats-table th {
  color: var(--muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.stats-table tr + tr {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.stat-label {
  color: var(--text);
  font-weight: 600;
}

.stat-value {
  color: var(--text);
  font-weight: 700;
}

.stat-rack {
  color: var(--accent);
  font-weight: 600;
}

.stat-multi-value,
.stat-multi-rack {
  line-height: 1.4;
}

.tabbed-tables-container {
  background: linear-gradient(160deg, #121a28 0%, #0f1724 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.tabs-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border);
}

.tab-button {
  background: transparent;
  border: none;
  padding: 0.95rem;
  color: var(--muted);
  font-weight: 700;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}

.tab-button:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.03);
}

.tab-button.active {
  color: var(--text);
  background: rgba(34, 211, 238, 0.08);
  border-bottom: 2px solid var(--accent);
}

.tab-icon {
  font-size: 1rem;
}

.tab-content {
  padding: 1rem 1.25rem 1.25rem;
}

.tab-panel {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.table-container {
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(12, 18, 31, 0.65);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: rgba(255, 255, 255, 0.02);
  color: var(--muted);
  text-align: left;
  padding: 0.75rem;
  font-size: 0.85rem;
  letter-spacing: 0.01em;
}

.data-table td {
  padding: 0.8rem 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text);
}

.data-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.subtotal-row {
  background: rgba(255, 255, 255, 0.04);
  font-weight: 700;
}

.subtotal-row td {
  border-top: 2px solid rgba(255, 255, 255, 0.08);
}

.subtotal-label {
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.name-cell {
  font-weight: 700;
}

.value-cell {
  color: var(--text);
}

.temp-range {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--muted);
}

.temp-min {
  color: var(--muted);
}

.temp-max {
  color: var(--text);
  font-weight: 700;
}

.status-cell {
  text-transform: capitalize;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.status-optimal {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.status-good {
  background: rgba(34, 211, 238, 0.12);
  color: var(--accent);
}

.status-warning {
  background: rgba(251, 191, 36, 0.12);
  color: var(--warning);
}

.status-critical {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.action-cell {
  text-align: right;
}

.graph-btn {
  background: rgba(34, 211, 238, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.4);
  color: var(--accent);
  padding: 0.4rem 0.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.graph-btn:hover {
  background: rgba(34, 211, 238, 0.2);
}

.export-section {
  display: flex;
  justify-content: flex-end;
  margin: 1.4rem 0;
}

.export-button {
  padding: 0.65rem 1rem;
}

.tabbed-tables-container + .export-section {
  margin-top: 1.25rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 10, 20, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: min(900px, 92vw);
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body {
  padding: 1rem 1.25rem 1.25rem;
}

.graph-container {
  background: #0e1726;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 0.75rem;
  width: 100%;
  height: 400px;
}

.time-series-chart {
  width: 100%;
  height: 100%;
}

.axis-label {
  fill: var(--muted);
  font-size: 0.75rem;
}

.series-legend {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--muted);
  font-weight: 600;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #0b1220;
}

.csv-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.csv-table-wrapper {
  max-height: 60vh;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.csv-table th,
.csv-table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  font-size: 0.95rem;
}

.csv-table thead {
  background: rgba(255, 255, 255, 0.04);
}

.csv-empty {
  color: var(--muted);
}

.y-axis-label {
  fill: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.no-data {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: relative;
    height: auto;
    top: 0;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .chart-stats-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .header-content {
    grid-template-columns: 1fr;
    padding: 1rem 1.25rem;
  }

  .main-content {
    padding: 1.25rem;
  }
}
</style>
