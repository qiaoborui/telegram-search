<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const fileInput = ref<HTMLInputElement>()
const isUploading = ref(false)
const uploadProgress = ref(0)

interface ImportedMessage {
  id: number
  date: string
  from?: string
  from_id?: string
  text?: string | Array<{ type: string, text: string }>
  chat_title?: string
}

interface TelegramExport {
  name: string
  type: string
  id: number
  messages: ImportedMessage[]
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  if (!file.name.endsWith('.json')) {
    toast.error('请选择 JSON 格式的文件')
    return
  }

  if (file.size > 500 * 1024 * 1024) { // 500MB limit
    toast.error('文件大小不能超过 500MB')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  try {
    const text = await file.text()
    uploadProgress.value = 25
    
    const data = JSON.parse(text) as TelegramExport
    
    if (!data.messages || !Array.isArray(data.messages)) {
      throw new Error('无效的 Telegram 导出格式')
    }

    uploadProgress.value = 50

    // Simulate processing for now - in a real implementation, this would send to the backend
    await new Promise(resolve => setTimeout(resolve, 1000))
    uploadProgress.value = 75
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    uploadProgress.value = 100
    
    toast.success(`文件解析成功！找到 ${data.messages.length} 条消息，准备导入到数据库`)
    
    // TODO: Send to backend for actual processing
    // websocketStore.sendEvent('import:data', { data })
    
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '导入失败')
  } finally {
    isUploading.value = false
    setTimeout(() => {
      uploadProgress.value = 0
      if (target) target.value = ''
    }, 2000)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="min-h-screen bg-background dark:bg-gray-900 p-6">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl text-gray-900 font-bold dark:text-gray-100">
          数据导入
        </h1>
        <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
          手动导入 Telegram 聊天记录数据
        </p>
      </div>

      <!-- Bot Mode Notice -->
      <div class="mb-8 border border-blue-200 rounded-xl bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
        <div class="flex items-start space-x-4">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span class="i-lucide-info text-white text-sm" />
          </div>
          <div>
            <h3 class="text-lg text-blue-900 font-semibold dark:text-blue-100">
              Bot 模式限制说明
            </h3>
            <div class="mt-2 text-blue-800 dark:text-blue-200">
              <p class="mb-2">使用 Bot Token 登录时，系统有以下限制：</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li>只能读取 Bot 已加入的群组和频道消息</li>
                <li>无法读取私人聊天消息</li>
                <li>无法读取 Bot 加入前的历史消息</li>
                <li>需要手动导入完整聊天记录</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Section -->
      <div class="border border-neutral-200 rounded-xl bg-card p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 class="mb-6 text-xl text-gray-900 font-semibold dark:text-gray-100">
          上传聊天记录
        </h2>

        <div class="mb-6">
          <div 
            class="border-2 border-dashed border-neutral-300 rounded-xl p-12 text-center transition hover:border-primary dark:border-gray-600 dark:hover:border-primary"
            :class="{ 'border-primary': isUploading }"
          >
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center dark:bg-gray-700">
              <span class="i-lucide-upload text-2xl text-neutral-600 dark:text-gray-400" />
            </div>
            
            <h3 class="mb-2 text-lg text-gray-900 font-medium dark:text-gray-100">
              选择导出文件
            </h3>
            <p class="mb-6 text-gray-600 dark:text-gray-400">
              支持 Telegram Desktop 导出的 JSON 格式文件
            </p>

            <div v-if="isUploading" class="mb-4">
              <div class="w-full h-2 rounded-full bg-neutral-200 dark:bg-gray-600">
                <div 
                  class="h-2 rounded-full bg-primary transition-all duration-300"
                  :style="{ width: `${uploadProgress}%` }"
                />
              </div>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                上传中... {{ uploadProgress }}%
              </p>
            </div>

            <button
              @click="triggerFileInput"
              :disabled="isUploading"
              class="mx-auto rounded-xl bg-primary px-6 py-3 text-white font-medium transition hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <span v-if="isUploading" class="i-lucide-loader-2 mr-2 animate-spin" />
              {{ isUploading ? '上传中...' : '选择文件' }}
            </button>

            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="handleFileUpload"
            >
          </div>
        </div>

        <!-- Instructions -->
        <div class="border border-neutral-200 rounded-xl bg-neutral-50 p-6 dark:border-gray-600 dark:bg-gray-700/50">
          <h3 class="mb-4 text-lg text-gray-900 font-medium dark:text-gray-100">
            如何导出聊天记录
          </h3>
          
          <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h4 class="font-medium text-gray-900 dark:text-gray-100">使用 Telegram Desktop：</h4>
              <ol class="mt-2 list-decimal list-inside space-y-1 ml-4">
                <li>打开 Telegram Desktop 客户端</li>
                <li>选择要导出的聊天</li>
                <li>点击右上角的三点菜单</li>
                <li>选择"导出聊天记录"</li>
                <li>选择 JSON 格式并确认导出</li>
                <li>等待导出完成后上传生成的 JSON 文件</li>
              </ol>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 dark:text-gray-100">支持的格式：</h4>
              <ul class="mt-2 list-disc list-inside space-y-1 ml-4">
                <li>Telegram Desktop 官方导出格式 (JSON)</li>
                <li>文件大小限制：500MB</li>
                <li>支持文本消息、媒体信息和用户数据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>