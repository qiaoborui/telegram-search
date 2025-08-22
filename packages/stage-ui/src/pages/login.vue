<script setup lang="ts">
import { useAuthStore, useWebsocketStore } from '@tg-search/client'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import Stepper from '../components/ui/Stepper.vue'

type LoginStep = 'mode' | 'phone' | 'code' | 'password' | 'bot' | 'complete'
type LoginMode = 'user' | 'bot'

const router = useRouter()

const authStore = useAuthStore()
const websocketStore = useWebsocketStore()
const { isLoggedIn } = storeToRefs(authStore)

const state = ref({
  currentStep: 'mode' as LoginStep,
  loginMode: 'user' as LoginMode,
  showAdvancedSettings: false,
  phoneNumber: websocketStore.getActiveSession()?.phoneNumber ?? '',
  verificationCode: '',
  twoFactorPassword: '',
  botToken: '',
})
authStore.auth.needCode = false
authStore.auth.needPassword = false
authStore.auth.isLoading = false

const {
  login,
  loginWithBot,
  submitCode,
  submitPassword,
} = authStore.handleAuth()

watch(() => authStore.auth.needCode, (value) => {
  if (value) {
    authStore.auth.isLoading = false
    state.value.currentStep = 'code'
  }
})

watch(() => authStore.auth.needPassword, (value) => {
  if (value) {
    authStore.auth.isLoading = false
    state.value.currentStep = 'password'
  }
})

watch(isLoggedIn, (value) => {
  if (value) {
    authStore.auth.isLoading = false
    state.value.currentStep = 'complete'
  }
})

const steps = [
  { step: 1, value: 'mode', title: '登录方式', description: '选择登录方式' },
  { step: 2, value: 'phone', title: '手机号', description: '输入您的 Telegram 手机号' },
  { step: 3, value: 'bot', title: 'Bot Token', description: '输入您的 Telegram Bot Token' },
  { step: 4, value: 'code', title: '验证码', description: '输入 Telegram 发送的验证码' },
  { step: 5, value: 'password', title: '二次验证', description: '输入两步验证密码' },
  { step: 6, value: 'complete', title: '完成', description: '登录成功' },
]

function redirectRoot() {
  toast.success('登录成功')
  router.push('/')
}

function selectLoginMode(mode: LoginMode) {
  state.value.loginMode = mode
  if (mode === 'user') {
    state.value.currentStep = 'phone'
  } else {
    state.value.currentStep = 'bot'
  }
}

async function handleLogin() {
  authStore.auth.isLoading = true

  try {
    switch (state.value.currentStep) {
      case 'mode':
        // This should not happen
        break
      case 'phone':
        login(state.value.phoneNumber)
        break
      case 'bot':
        loginWithBot(state.value.botToken)
        break
      case 'code':
        submitCode(state.value.verificationCode)
        break
      case 'password':
        submitPassword(state.value.twoFactorPassword)
        break
    }
  }
  catch (error) {
    toast.error(error instanceof Error ? error.message : String(error))
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
    <div class="max-w-md w-full rounded-2xl bg-card p-10 shadow-2xl dark:bg-gray-800">
      <h1 class="mb-6 text-center text-3xl text-gray-900 font-bold tracking-tight dark:text-gray-100">
        Telegram 登录
      </h1>
      <Stepper :steps="steps" :current-step="state.currentStep" />
      <p class="mb-8 text-center text-lg text-gray-600 font-medium dark:text-gray-400">
        {{ steps.find(s => s.value === state.currentStep)?.description }}
      </p>

      <!-- 登录方式选择 -->
      <div v-if="state.currentStep === 'mode'" class="space-y-6">
        <div class="space-y-4">
          <button
            type="button"
            class="w-full border border-neutral-200 rounded-xl bg-neutral-100 p-6 text-left transition hover:bg-neutral-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            @click="selectLoginMode('user')"
          >
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span class="i-lucide-user text-white text-xl" />
              </div>
              <div>
                <h3 class="text-lg text-gray-900 font-semibold dark:text-gray-100">用户登录</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">使用手机号和验证码登录您的 Telegram 账号</p>
              </div>
            </div>
          </button>
          
          <button
            type="button"
            class="w-full border border-neutral-200 rounded-xl bg-neutral-100 p-6 text-left transition hover:bg-neutral-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            @click="selectLoginMode('bot')"
          >
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <span class="i-lucide-bot text-white text-xl" />
              </div>
              <div>
                <h3 class="text-lg text-gray-900 font-semibold dark:text-gray-100">Bot 登录</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">使用 Bot Token 登录，需要手动导入聊天记录</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Bot Token 表单 -->
      <form v-if="state.currentStep === 'bot'" class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label for="botToken" class="mb-2 block text-base text-gray-900 font-semibold dark:text-gray-100">Bot Token</label>
          <input
            id="botToken"
            v-model="state.botToken"
            type="password"
            placeholder="1234567890:AAAA_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
            class="w-full border border-neutral-200 rounded-xl bg-neutral-100 px-5 py-4 text-xl text-gray-900 transition disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-offset-gray-800"
            required
            :disabled="authStore.auth.isLoading"
          >
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            从 @BotFather 获取您的 Bot Token
          </p>
        </div>
        <div class="flex space-x-3">
          <button
            type="button"
            class="flex-1 border border-neutral-200 rounded-xl bg-neutral-100 py-4 text-lg text-gray-900 font-bold transition hover:bg-neutral-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            @click="state.currentStep = 'mode'"
          >
            返回
          </button>
          <button
            type="submit"
            class="flex-1 flex items-center justify-center rounded-xl bg-primary py-4 text-lg text-white font-bold transition disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-primary/90 dark:disabled:bg-gray-700"
            :disabled="authStore.auth.isLoading"
          >
            <span v-if="authStore.auth.isLoading" class="i-lucide-loader-2 mr-2 animate-spin" />
            {{ authStore.auth.isLoading ? '处理中...' : '登录' }}
          </button>
        </div>
      </form>

      <!-- 手机号码表单 -->
      <form v-if="state.currentStep === 'phone'" class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label for="phoneNumber" class="mb-2 block text-base text-gray-900 font-semibold dark:text-gray-100">手机号码</label>
          <input
            id="phoneNumber"
            v-model="state.phoneNumber"
            type="tel"
            placeholder="+86 123 4567 8901"
            class="w-full border border-neutral-200 rounded-xl bg-neutral-100 px-5 py-4 text-xl text-gray-900 transition disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-offset-gray-800"
            required
            :disabled="authStore.auth.isLoading"
          >
        </div>
        <div class="flex space-x-3">
          <button
            type="button"
            class="flex-1 border border-neutral-200 rounded-xl bg-neutral-100 py-4 text-lg text-gray-900 font-bold transition hover:bg-neutral-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            @click="state.currentStep = 'mode'"
          >
            返回
          </button>
          <button
            type="submit"
            class="flex-1 flex items-center justify-center rounded-xl bg-primary py-4 text-lg text-white font-bold transition disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-primary/90 dark:disabled:bg-gray-700"
            :disabled="authStore.auth.isLoading"
          >
            <span v-if="authStore.auth.isLoading" class="i-lucide-loader-2 mr-2 animate-spin" />
            {{ authStore.auth.isLoading ? '处理中...' : '登录' }}
          </button>
        </div>
      </form>

      <!-- 验证码表单 -->
      <form v-if="state.currentStep === 'code'" class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label for="verificationCode" class="mb-2 block text-base text-gray-900 font-semibold dark:text-gray-100">验证码</label>
          <input
            id="verificationCode"
            v-model="state.verificationCode"
            type="text"
            placeholder="请输入 Telegram 发送的验证码"
            class="w-full border border-neutral-200 rounded-xl bg-neutral-100 px-5 py-4 text-xl text-gray-900 transition disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-offset-gray-800"
            required
            :disabled="authStore.auth.isLoading"
          >
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            请检查您的 Telegram 应用或短信
          </p>
        </div>
        <button
          type="submit"
          class="w-full flex items-center justify-center rounded-xl bg-primary py-4 text-lg text-white font-bold transition disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-primary/90 dark:disabled:bg-gray-700"
          :disabled="authStore.auth.isLoading"
        >
          <span v-if="authStore.auth.isLoading" class="i-lucide-loader-2 mr-2 animate-spin" />
          {{ authStore.auth.isLoading ? '处理中...' : '验证' }}
        </button>
      </form>

      <!-- 两步验证密码表单 -->
      <form v-if="state.currentStep === 'password'" class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label for="twoFactorPassword" class="mb-2 block text-base text-gray-900 font-semibold dark:text-gray-100">两步验证密码</label>
          <input
            id="twoFactorPassword"
            v-model="state.twoFactorPassword"
            type="password"
            placeholder="请输入您的两步验证密码"
            class="w-full border border-neutral-200 rounded-xl bg-neutral-100 px-5 py-4 text-xl text-gray-900 transition disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-offset-gray-800"
            required
            :disabled="authStore.auth.isLoading"
          >
        </div>
        <button
          type="submit"
          class="w-full flex items-center justify-center rounded-xl bg-primary py-4 text-lg text-white font-bold transition disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-primary/90 dark:disabled:bg-gray-700"
          :disabled="authStore.auth.isLoading"
        >
          <span v-if="authStore.auth.isLoading" class="i-lucide-loader-2 mr-2 animate-spin" />
          {{ authStore.auth.isLoading ? '处理中...' : '登录' }}
        </button>
      </form>

      <!-- 登录完成 -->
      <div v-if="state.currentStep === 'complete'" class="text-center">
        <div class="mb-4 text-3xl">
          🎉
        </div>
        <h2 class="text-xl text-gray-900 font-bold dark:text-gray-100">
          登录成功！
        </h2>
        <p class="mt-2 text-lg text-gray-600 dark:text-gray-400">
          {{ state.loginMode === 'bot' ? '您已成功登录 Telegram Bot' : '您已成功登录 Telegram 账号' }}
        </p>
        
        <!-- Bot mode specific instructions -->
        <div v-if="state.loginMode === 'bot'" class="mt-6 border border-blue-200 rounded-xl bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p class="text-sm text-blue-800 dark:text-blue-200 mb-3">
            Bot 模式下，您需要手动导入聊天记录才能开始搜索。
          </p>
          <div class="flex space-x-3">
            <router-link 
              to="/import"
              class="flex-1 rounded-xl bg-blue-600 py-3 text-sm text-white font-medium transition hover:bg-blue-700"
            >
              导入数据
            </router-link>
            <button
              class="flex-1 rounded-xl bg-primary py-3 text-sm text-white font-medium transition hover:bg-primary/90"
              @click="redirectRoot"
            >
              进入主页
            </button>
          </div>
        </div>
        
        <!-- User mode normal button -->
        <button
          v-else
          class="mt-6 w-full rounded-xl bg-primary py-4 text-lg text-white font-bold transition hover:bg-primary/90"
          @click="redirectRoot"
        >
          进入主页
        </button>
      </div>

      <!-- Bot 模式帮助信息 -->
      <div v-if="state.loginMode === 'bot' && state.currentStep !== 'complete'" class="mt-8 border border-amber-200 rounded-xl bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
        <div class="flex items-start space-x-4">
          <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <span class="i-lucide-help-circle text-white text-sm" />
          </div>
          <div>
            <h3 class="text-lg text-amber-900 font-semibold dark:text-amber-100">
              Bot 模式使用提示
            </h3>
            <div class="mt-2 text-amber-800 dark:text-amber-200">
              <p class="mb-3">Bot 模式适合以下场景：</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li>不想使用个人账号登录</li>
                <li>只需要搜索特定群组的消息</li>
                <li>希望通过手动导入来搜索历史数据</li>
              </ul>
              <p class="mt-3 text-sm">
                <strong>注意：</strong>登录后您需要手动导入聊天记录才能进行搜索。
                <router-link to="/import" class="text-amber-700 underline hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-200">
                  了解如何导入 →
                </router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
