/**
 * 自定义 showToast — 替代 Vant showToast，效果一致
 * 深色半透明背景 + 白色文字，居中显示，2秒自动消失
 */

let timer = null

export function showToast(message) {
  // 清除上一个未消失的 toast，避免堆叠
  const exist = document.querySelector('.custom-toast')
  if (exist) exist.remove()
  if (timer) clearTimeout(timer)

  // 创建 toast 容器
  const toast = document.createElement('div')
  toast.className = 'custom-toast'
  toast.textContent = message

  document.body.appendChild(toast)

  // 触发入场动画（下一帧添加 show 类）
  requestAnimationFrame(() => {
    toast.classList.add('custom-toast--show')
  })

  // 2 秒后移除
  timer = setTimeout(() => {
    toast.classList.remove('custom-toast--show')
    toast.addEventListener('transitionend', () => toast.remove())
    // 兜底：如果 transitionend 不触发，600ms 后强制移除
    setTimeout(() => { if (toast.parentNode) toast.remove() }, 600)
  }, 2000)
}
