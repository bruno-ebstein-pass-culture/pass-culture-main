interface IDimension {
  width: number
  height: number
}

const getCropMaxDimension = ({
  originalDimensions,
  orientation,
}: {
  originalDimensions: IDimension
  orientation: 'portrait' | 'landscape'
}): IDimension => {
  if (orientation === 'landscape') {
    return {
      width: Math.floor(
        Math.min(originalDimensions.width, (originalDimensions.height / 2) * 3)
      ),
      height: Math.floor(
        Math.min(originalDimensions.height, (originalDimensions.width / 3) * 2)
      ),
    }
  } else {
    return {
      width: Math.floor(
        Math.min(originalDimensions.width, (originalDimensions.height / 3) * 2)
      ),
      height: Math.floor(
        Math.min(originalDimensions.height, (originalDimensions.width / 2) * 3)
      ),
    }
  }
}

export default getCropMaxDimension
