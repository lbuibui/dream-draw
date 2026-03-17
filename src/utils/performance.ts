// 性能检测与优化工具

/**
 * 检测设备性能等级
 */
export const detectPerformanceLevel = (): 'high' | 'medium' | 'low' => {
    // 检测内存
    const memory = (navigator as any).deviceMemory;
    // 检测核心数
    const cores = navigator.hardwareConcurrency;
    // 检测是否支持 WebGL（硬件加速）
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    // 低性能：内存小于4GB，或少于4核，或无WebGL
    if ((memory && memory < 4) || (cores && cores < 4) || !gl) {
        return 'low';
    }
    
    // 中性能：内存4-8GB，或4-6核
    if ((memory && memory < 8) || (cores && cores < 6)) {
        return 'medium';
    }
    
    return 'high';
};

/**
 * 根据性能等级返回是否应该启用动画效果
 */
export const shouldEnableAnimations = (): boolean => {
    return detectPerformanceLevel() !== 'low';
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => void>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * 虚拟化列表：计算应该渲染的可见项
 */
export const getVisibleRange = (
    scrollTop: number,
    viewportHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan: number = 3
): { start: number; end: number } => {
    const startIdx = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    
    const start = Math.max(0, startIdx - overscan);
    const end = Math.min(totalItems, startIdx + visibleCount + overscan);
    
    return { start, end };
};
