const axios = require('axios')
const json = require('./zh-cn.json')
const pattern = /^每日/i
const pattern1 = /^赏金(猎人)?(每日)?/i
const pattern2 = /^商贩(每日)?/i
const pattern3 = /^收藏(家)?(每日)?/i
const pattern4 = /^私酒(贩)?(每日)?/i
const pattern5 = /^博物(学家)?(每日)?/i
const pattern6 = /^全部(每日)?/i
const pattern7 = /^教程/i
const pattern8 = /^自由(模式)?(活动)?(时间)?/
const pattern9 = /^下一场(活动)?(时间)?/

// 自由模式数据
const { freeArr, occArr } = require('./free')

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36'

async function getDailies () {
  try {
    const now = new Date()
    const date = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
    let { data: {data} } = await axios({
      url: `https://pepegapi.jeanropke.net/v3/rdo/dailies?nocache=${date}`,
      timeout: 10000,
      headers: {
        'user-agent': USER_AGENT
      }
    })
    if (!data) {
      return ''
    }
    const arr = [data.general]
    arr.push(...data.hard)
    let str
    const obj = {
      date: date+'\n'
    }
    arr.forEach(val => {
      str = `${json[val.role]}:\n`
      val.challenges && val.challenges.forEach((el, index) => {
        str += `${index+1}、${json[el.description.label.toLocaleLowerCase()]} (${el.desiredGoal}) \n`
      })
      obj[val.role] = str
    })
    return obj
  } catch (error) {
    return '没有查询到数据'
  }
}

// 自由模式活动数据
function getFree () {
  let msg = '自由模式活动: \n'
  freeArr.forEach(v => {
    msg += `${v.time}: ${v.name} \n`
  })
  msg += '\n职业活动: \n'
  occArr.forEach(v => {
    msg += `${v.time}: ${v.name} \n`
  })
  return msg
}

// 当前活动
function getNowAction () {
  const now = new Date()
  const date = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} `
  const calcTime = (v) => new Date(date+v.time) > now
  const obj = freeArr.find(v => calcTime(v)) || {}
  const obj2 = occArr.find(v => calcTime(v)) || {}
  const funcT = (time) => Math.floor((new Date(date+time) - now) / 1000 / 60)
  let msg = `下一场自由模式活动: ${obj.time}: ${obj.name} (${funcT(obj.time)}分钟后开始) \n`
  msg += `下一场职业活动: ${obj2.time}: ${obj2.name} (${funcT(obj2.time)}分钟后开始)`
  return msg
}

function sendMsg (ws, data, message) {
  if (data.message_type === 'group') {
    ws.send('send_msg', {
      message_type: 'group',
      group_id: data.group_id,
      message
    })
  } else if (data.message_type === 'private') {
    ws.send('send_private_msg', {
      user_id: data.user_id,
      message
    })
  }
}

module.exports = options => {
  return async ({ data, ws, http }) => {
    if (!data.message) {
      return
    }

    let message = data.message.trim()

    // 特殊逻辑处理
    if (pattern7.test(message)) {
      sendMsg(ws, data, 'https://tieba.baidu.com/home/main?un=ZzzZXSshshbs&fr=home&id=tb.1.2dfe22e3.cgfjJLr9ldY-XAzCG72n6w')
      return
    } else if (pattern8.test(message)) {
      sendMsg(ws, data, getFree())
      return
    } else if (pattern9.test(message)) {
      sendMsg(ws, data, getNowAction())
      return
    }


    let type
    if (pattern.test(message)) {
      type = 'CHARACTER_RANK'
    } else if (pattern1.test(message)) {
      type = 'CHARACTER_RANK_BOUNTY_HUNTER'
    } else if (pattern2.test(message)) {
      type = 'CHARACTER_RANK_TRADER'
    } else if (pattern3.test(message)) {
      type = 'CHARACTER_RANK_COLLECTOR'
    } else if (pattern4.test(message)) {
      type = 'CHARACTER_RANK_MOONSHINER'
    } else if (pattern5.test(message)) {
      type = 'CHARACTER_RANK_NATURALIST'
    } else if (pattern6.test(message)) {
      type = 'ALL'
    } else {
      return
    }

    // 请求每日数据
    const msg = await getDailies()
    let message2 = ''
    if (typeof msg === 'string') {
      message2 = msg
    } else {
      if (type === 'ALL') {
        Object.keys(msg).forEach(key => {
          message2 += msg[key]
        })
      } else {
        message2 = msg[type]
      }
    }
    sendMsg(ws, data, message2)
  }
}
