import { computed } from 'vue'
import { MutationTypes, useStore } from '@/store'
import { PPTElement, Slide } from '@/types/slides'
import { ElementAlignCommand, ElementAlignCommands } from '@/types/edit'
import { getElementListRange } from '@/utils/element'
import useHistorySnapshot from './useHistorySnapshot'

export default () => {
  const store = useStore()

  const activeElementIdList = computed(() => store.state.activeElementIdList)
  const activeElementList = computed<PPTElement[]>(() => store.getters.activeElementList)
  const currentSlide = computed<Slide>(() => store.getters.currentSlide)

  const { addHistorySnapshot } = useHistorySnapshot()

  /**
   * 对齐选中的元素
   * @param command 对齐方向
   */
  const alignActiveElement = (command: ElementAlignCommand) => {
    const { minX, maxX, minY, maxY } = getElementListRange(activeElementList.value)
    const elementList: PPTElement[] = JSON.parse(JSON.stringify(currentSlide.value.elements))

    // 如果所选择的元素为组合元素的成员，需要计算该组合的整体范围
    const groupElementRangeMap = {}
    for (const activeElement of activeElementList.value) {
      if (activeElement.groupId && !groupElementRangeMap[activeElement.groupId]) {
        const groupElements = activeElementList.value.filter(item => item.groupId === activeElement.groupId)
        groupElementRangeMap[activeElement.groupId] = getElementListRange(groupElements)
      }
    }

    // 根据不同的命令，计算对齐的位置
    if (command === ElementAlignCommands.LEFT) {
      elementList.forEach(element => {
        if (activeElementIdList.value.includes(element.id)) {
          if (!element.groupId) element.left = minX
          else {
            const range = groupElementRangeMap[element.groupId]
            const offset = range.minX - minX
            element.left = element.left - offset
          }
        }
      })
    }
    else if (command === ElementAlignCommands.RIGHT) {
      elementList.forEach(element => {
        if (activeElementIdList.value.includes(element.id)) {
          if (!element.groupId) {
            const elWidth = element.type === 'line' ? Math.max(element.start[0], element.end[0]) : element.width
            element.left = maxX - elWidth
          }
          else {
            const range = groupElementRangeMap[element.groupId]
            const offset = range.maxX - maxX
            element.left = element.left - offset
          }
        }
      })
    }
    else if (command === ElementAlignCommands.TOP) {
      elementList.forEach(element => {
        if (activeElementIdList.value.includes(element.id)) {
          if (!element.groupId) element.top = minY
          else {
            const range = groupElementRangeMap[element.groupId]
            const offset = range.minY - minY
            element.top = element.top - offset
          }
        }
      })
    }
    else if (command === ElementAlignCommands.BOTTOM) {
      elementList.forEach(element => {
        if (activeElementIdList.value.includes(element.id)) {
          if (!element.groupId) {
            const elHeight = element.type === 'line' ? Math.max(element.start[1], element.end[1]) : element.height
            element.top = maxY - elHeight
          }
          else {
            const range = groupElementRangeMap[element.groupId]
            const offset = range.maxY - maxY
            element.top = element.top - offset
          }
        }
      })
    }
    else if (command === ElementAlignCommands.HORIZONTAL) {
      const horizontalCenter = (minX + maxX) / 2
      elementList.forEach(element => {
        if (activeElementIdList.value.includes(element.id)) {
          if (!element.groupId) {
            const elWidth = element.type === 'line' ? Math.max(element.start[0], element.end[0]) : element.width
            element.left = horizontalCenter - elWidth / 2
          }
          else {
            const range = groupElementRangeMap[element.groupId]
            const center = (range.maxX + range.minX) / 2
            const offset = center - horizontalCenter
            element.left = element.left - offset
          }
        }
      })
    }
    else if (command === ElementAlignCommands.VERTICAL) {
      const verticalCenter = (minY + maxY) / 2
      elementList.forEach(element => {
        if (activeElementIdList.value.includes(element.id)) {
          if (!element.groupId) {
            const elHeight = element.type === 'line' ? Math.max(element.start[1], element.end[1]) : element.height
            element.top = verticalCenter - elHeight / 2
          }
          else {
            const range = groupElementRangeMap[element.groupId]
            const center = (range.maxY + range.minY) / 2
            const offset = center - verticalCenter
            element.top = element.top - offset
          }
        }
      })
    }
    
    store.commit(MutationTypes.UPDATE_SLIDE, { elements: elementList })
    addHistorySnapshot()
  }

  return {
    alignActiveElement,
  }
}