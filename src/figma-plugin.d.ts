/// <reference path="../node_modules/@figma/plugin-typings/plugin-api.d.ts" />

declare const figma: PluginAPI
declare const __html__: string
declare const __uiFiles__: {
  [key: string]: string
}

declare module '!*.css'
