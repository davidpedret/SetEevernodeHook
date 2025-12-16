import { Client, Wallet } from '@transia/xrpl'
import { clearAllHooksV3, SetHookParams } from '@transia/hooks-toolkit'

import * as readline from 'readline'

const askQuestion = (rl: readline.Interface, prompt: string) => {
  return new Promise<string>((resolve) => rl.question(prompt, resolve))
}

export async function main(): Promise<void> {
  const serverUrl = 'wss://xahau.network'
  const client = new Client(serverUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    await client.connect()
    client.networkID = await client.getNetworkID()

    const seed = await askQuestion(rl, 'Please input your Host secret[seed]:')

    const consent = await askQuestion(
      rl,
      `Are you sure you want to remove all hooks using the seed [${seed}]  [yes/N]?`,
    )

    if (consent.toLowerCase() !== 'yes') {
      console.log('BA BYE')
      return
    }

    const myWallet = Wallet.fromSeed(seed)

    console.log('Removing Hooks...')

    try {
      await clearAllHooksV3({
        client: client,
        seed: myWallet.seed,
      } as SetHookParams)
    } catch (error) {
      console.error('Error Removing hooks:', error)
    }
  } catch (error) {
    console.error('Error occurred:', error)
  } finally {
    rl.close()
    await client.disconnect()
    console.log('Disconnected from server.')
  }
}

main()
