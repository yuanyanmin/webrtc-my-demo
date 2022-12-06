// const sip_address = "172.21.152.56", ws_port = "5066", sip_port = "5050";	//服务器地址 ， FreeSwitch //112.74.54.80
$(document).ready(function() {
  let uKeFuSoftPhone

  $(document).on('click', '[data-toggle="soft-function"]', function(e) {
    if ($(this).closest('.disabled').length == 0) {
      let name = $(this).data('action')
      if (name === 'login') {
        uKeFuSoftPhone.input()
      } else if (name === 'logout') {
        uKeFuSoftPhone.logout()
      } else if (name === 'ready') {
        uKeFuSoftPhone.ready()
      } else if (name === 'notready') {
        uKeFuSoftPhone.notready()
      } else if (name === 'answer') {
        uKeFuSoftPhone.answer()
      } else if (name === 'hungup') {
        uKeFuSoftPhone.hungup()
      } else if (name === 'hold') {
        uKeFuSoftPhone.hold()
      } else if (name === 'unhold') {
        uKeFuSoftPhone.unhold()
      }
    }
  })

	let ondial = false;
  let eventHandlers = {
    'progress': function(e) {
      console.log('call is in progress');
    },
    'failed': function(e) {
      console.log('call failed: ', e);
    },
    'ended': function(e) {
      console.log('call ended : ', e);
    },
    'confirmed': function(e) {
      console.log('call confirmed');
    }
  };
  const remoteAudio = document.getElementById('remoteAudio')

  // 登陆
  $('#login-btn').click(function() {
    $('#ukefu-login-html').hide()
    // const extno = $("#extno").val()
    // const extpass = $("#extpass").val()
    // const expwss = $("#expwss").val()

    const sip_addr = $('#sip_addr').val()
    const sip_port = $("#sip_port").val()
    const ws_port = $("#ws_port").val()
    const sip_no = $("#sip_no").val()
    const sip_pass = $("#sip_pass").val()
    const ws_type = $("#ws_type").val() || 'wss'

    const ws_uri = `${ws_type}://${sip_addr}:${ws_port}`
    const sip_uri = `sip:${sip_no}@${sip_addr}:${sip_port}`

    console.info(`获取到的注册信息：sip_uri:${sip_uri};sip_password:${sip_pass};ws_url:${ws_uri}`);

    $('#caller .number').text(sip_no);

    uKeFuSoftPhone.login(sip_uri, ws_uri, sip_pass)

  })

  // 关闭
  $('#logout-btn').click(function() {
    console.log('close');
    $('#ukefu-login-html').hide()
  })

  $('#softphone-makecall').click(function() {
    if ($(this).closest('.disabled').length === 0) {
      $('#dialpad').show()
    }
  })

  $('#dialpad .number').on('mousedown', function(e) {
    $(this).css('background-color', '#1E90FF')
  }).on('mouseup', function(e) {
    $(this).css('background-color', '#FFFFFF')
  }).on('click', function(e) {
    $('#dialpad-input').val($('#dialpad-input').val() + $(this).attr('id'))
  })

  $('#makecall').on('click', function() {
    uKeFuSoftPhone.invite($('#dialpad-input').val());
    $('#dialpad-input').val("") ;
    $('#dialpad').hide();
    // if(new RegExp(/^(0\d{2,3}-{0,1}\d{5,8}(-{0,1}\d{3,5}){0,1})|(((13[0-9])|(15([0-3]|[5-9]))|(18[0,5-9]))\d{8})|(1[0-9]{3})$/).test($('#dialpad-input').val())){
		// 	uKeFuSoftPhone.invite($('#dialpad-input').val());
		// 	$('#dialpad-input').val("") ;
		// 	$('#dialpad').hide();
		// } else{
		// 	// layer.msg("无效的号码，请重新输入");
    //   alert('无效的号码，请重新输入')
		// }
  })

  $('#dialpad').hover(function() {
    ondial = true
  }, function() {
    ondial = false
    setTimeout(function() {
      if (ondial === false) {
        $('#dialpad').hide()
      }
    }, 1000)
  })

  let softPhoneUA , currentSession , mediaStream, outgoingSession, incomingSession 

  uKeFuSoftPhone = {
    getOptions: function() {
      // let options = {
      //   media: {
      //     constraints: {
      //       audio: true,
      //       video: false
      //     },
      //     render: {
      //       remote: document.getElementById('remoteAudio'),
      //       local: document.getElementById('localAudio')
      //     }
      //   }
      // }
      let options = {
        mediaConstraints: {
          'audio': true,
          'video': false
        },
        'eventHandlers': eventHandlers
      }
      return options ;
    },
    input: function() {
      $('#ukefu-login-html').show()
    },
    login: function(sip_uri, ws_uri, sip_pass) {
     

      const socket = new JsSIP.WebSocketInterface(ws_uri)

      let config = {
        sockets: [socket],
        outbound_proxy_set: ws_uri,
        uri: sip_uri,  //与用户代理关联的SIP URI（字符串）。这是您的提供商提供给您的SIP地址
        password: sip_pass,  //SIP身份验证密码
        register: true,  //指示启动时JsSIP用户代理是否应自动注册
        session_timers: false  //启用会话计时器（根据RFC 4028）
      }
      softPhoneUA = new JsSIP.UA(config)

      // 成功注册触发。
      softPhoneUA.on('registered', function(data) {
        // 注册成功
        console.log('registered', data.response.status_code)
        uKeFuSoftPhone.status.ready()
      })
      // 未注册。
      softPhoneUA.on('unregistered', function(data) {
        // 未注册
        console.log('unregistered', data.response.status_code)
        uKeFuSoftPhone.status.notready()
      })
      // 因注册失败而触发。
      softPhoneUA.on('registrationFailed', function() {
        // 注册失败
        console.log('registrationFailed')
        uKeFuSoftPhone.status.notready()
      })
      // // 注册过期之前触发几秒钟
      // softPhoneUA.on('registrationExpiring', function() {
      //   // 注册到期
      //   console.log("registrationExpiring");
      //   uKeFuSoftPhone.status.notready()
      // })

      softPhoneUA.on('disconnected', function() {
        // 传输连接尝试（或自动重新尝试）失败时触发。
        console.log("disconnected");
        uKeFuSoftPhone.status.logout()
      })

      softPhoneUA.on('connected', function() {
        // 传输连接建立时触发。
        console.log("connected");
      })

      // invite
      // 传入或传出的会话/呼叫触发。
      softPhoneUA.on('newRTCSession', function(data) {
        // 传入或传出会话
        console.log("newRTCSession");
        if (data.originator === 'remote') {
          // 接电话
          console.log("incomingSession, answer the call");
          uKeFuSoftPhone.status.callIn();
          currentSession = data.session
          uKeFuSoftPhone.sessionEvent(currentSession);
        } else {
          // 打电话
          console.log('outgoingSession, calling')
          currentSession = data.session
          // 监听远程的音频流
          currentSession.connection.addEventListener('addstream', (ev) => {
            // youVideo.srcObject = ev.stream;
            console.log('out onaddstream from remote - ', ev.stream);
            remoteAudio.srcObject = ev.stream
            remoteAudio.play();
            remoteAudio.volume = 1
          })

          // 在本地媒体流被添加之后RTCSession并且在ICE收集开始之前触发初始INVITE请求或“200 OK”响应传输之后触发。
          currentSession.on('connecting', (data) => {
            console.log('onconnecting', data.request)
            // currentSession = session
          })
          uKeFuSoftPhone.sessionEvent(currentSession);
        }
        
      });
      // 针对传入或传出的MESSAGE请求触发。
      softPhoneUA.on('newMessage', function (data) {
        if (data.originator == 'local') {
          console.info('onNewMessage , OutgoingRequest - ', data.request);
        } else {
          console.info('onNewMessage , IncomingRequest - ', data.request);
        }
      })
      console.info("call register")

      // 设置为登录后的状态
      uKeFuSoftPhone.status.login()
    },
    /**
     * 就绪
     * 注册成功
     * 连接到信令服务器
     */
    ready: function() {
      console.log('ready-连接信令服务器');
      // 连接到信令服务器
      softPhoneUA.start();
    },
    /**
     * 拨打电话
     * @param {*} pnumber 
     */
    invite: function(pnumber) {
      let options = {
        'eventHandlers'    : eventHandlers,
        'mediaConstraints' : { 'audio': true, 'video': false },
        // 'pcConfig': {
        //     'iceServers': [
        //         {
        //             'urls': ['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']
        //         }
        //      ]
        //  }
      }
      currentSession = softPhoneUA.call(pnumber, options)
      // 设置为呼出的状态
      uKeFuSoftPhone.status.callOut();
    },
    /**
     * 退出登录
     * 取消注册
     */
    logout: function(){
      // softPhoneUA.unregister({all: true});
      softPhoneUA.stop()
    },
    /**
     * 接听电话
     * 
     */
    answer: function(){
      console.log('answer');
      if (currentSession) {
        currentSession.answer({
          mediaConstraints: {
            audio: true,
            video: false
          }
        })
        uKeFuSoftPhone.status.accepted();
      }
    },
    hungup: function(){
      // if(currentSession){
      //   if(currentSession.hasAnswer){
      //     currentSession.bye();
      //   }else if(currentSession.isCanceled == false){
      //     currentSession.cancel();
      //   }else{
      //     currentSession.reject();
      //   }
      // }
      currentSession = softPhoneUA && softPhoneUA.terminateSessions()
      uKeFuSoftPhone.status.hungup();
      
    },
    hold: function(){
      console.log('currr', currentSession.hasAnswer);
      if(currentSession && currentSession.hasAnswer){
        currentSession.hold();
      }
    },
    unhold: function(){
      if(currentSession && currentSession.hasAnswer){
        currentSession.unhold();
      }
    },
    notready: function(){
      softPhoneUA.unregister(true);
    },
    sessionEvent: function(session){
      // session.on("rejected", function (response, cause){
      //   uKeFuSoftPhone.status.hungup();
      // });
      // session.on("bye", function (response, cause){
      //   uKeFuSoftPhone.status.hungup();
      // });
      // 当用户或同伴将另一方搁置时触发。
      session.on("hold", function (response, cause){
        uKeFuSoftPhone.status.hold();
      });
      // 当用户或同伴恢复另一端保持时触发。
      session.on("unhold", function (response, cause){
        uKeFuSoftPhone.status.unhold();
      });
      // session.on("cancel", function (response, cause){
      //   uKeFuSoftPhone.status.hungup();
      // });
      // 接听电话时发出（2XX收/发）。
      session.on("accept", function (response, cause){
        console.log('accept');
        // TODO
        uKeFuSoftPhone.status.accepted();
      });
      // 在接收或生成对INVITE请求的1XX SIP类响应（> 100）时触发。
      session.on("progress", function (response, cause){
        console.log('progress', response);
        if (response.originator === 'remote') {
          // 接听
          // uKeFuSoftPhone.status.callIn();
          // session.answer({
          //   mediaConstraints: {
          //     audio: true,
          //     video: false
          //   }
          // })
        }
      });
      // 一旦底层RTCPeerConnection被创建，就会被触发。例如，应用程序有机会通过添加对象RTCDataChannel或设置相应的事件侦听器来改变对等连接。
      session.on("peerconnection", (response, cause) => {
        console.log('peerconnection', response, currentSession);

        if (response.originator === 'remote' && currentSession === null) {
          // 拿到远端的音频流
          console.log('session', session.connection);
          session.connection.addEventListener("addstream", (ev) => {
            console.log('in onaddstream from remote', ev.stream)
            // youVideo.srcObject = ev.stream
            remoteAudio.srcObject = ev.stream
            remoteAudio.play();
            remoteAudio.volume = 1;
          })
        }

      });
      // 通话确认（ACK收/发）时触发。
      session.on("confirmed", function (response, cause){
        console.log('confirmed');

        // // if (remotedata.originator === 'remote' && currentSession === null) {
        //   if (response.originator === 'remote' && currentSession === null) {
        
        //   // currentSession = incomingSession
        //   // incomingSession = null
        //   console.log('setcurrentsession', currentSession)
        // }

      });
      
      // 当已建立的通话结束时触发。
      session.on('ended', (response) => {
        let stream1 = remoteAudio.srcObject
        if (stream1 != undefined) {
          let tracks = stream1.getTracks()
          if (tracks != undefined) {
            tracks.forEach(track => {
              track.stop()
            })
          }
        }

        // if (myHangup) {
        //   myHangup = false
        //   alert('通过结束')
        // } else {
        //   confirm('对方已挂断')
        // }
        console.log('call ended with cause:', response, response.cause)

        uKeFuSoftPhone.status.hungup();
      })
      // 会议无法建立时触发。
      session.on('failed', function(data) {
        console.log('failed')
        // incomingSession = null
        // 远端呼叫取消
        if (data.cause === 'Canceled' && data.originator === 'remote') {
          // 主叫取消呼叫
          alert('对端已经取消呼叫')
          // resetAnswerBtn()
        } else if (data.cause === 'Rejected' && data.originator==='remote') {
          alert('对端拒接接听')
        }
        uKeFuSoftPhone.status.hungup();

      })


      uKeFuSoftPhone.status.initCallStatus(session);
    },
    status: {
      login: function(){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').addClass("disabled");
        
        $('#softphone-status .hold').addClass("disabled").show();
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').addClass("disabled");
        $('#softphone-makecall').addClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
  
        $('#softphone-status .ready').removeClass("disabled").show();
        $('#softphone-status .notready').addClass("disabled").hide();
      },
      ready: function(){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').addClass("disabled");
        
        $('#softphone-status .hold').addClass("disabled").show();
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').addClass("disabled");
        $('#softphone-makecall').removeClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
        $('#softphone-status .ready').addClass("disabled").hide();
        $('#softphone-status .notready').removeClass("disabled").show();
      },
      notready: function(){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').addClass("disabled");
  
        $('#softphone-status .hold').addClass("disabled").show();
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').addClass("disabled");
        $('#softphone-makecall').addClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
  
        $('#softphone-status .ready').removeClass("disabled").show();
        $('#softphone-status .notready').addClass("disabled").hide();
  
      },
      callIn: function(){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').removeClass("disabled");
        $('#softphone-hungup').removeClass("disabled");
        
        $('#softphone-status .hold').addClass("disabled").show();;
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').addClass("disabled");
        $('#softphone-makecall').addClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
  
        $('#softphone-status .ready').addClass("disabled").hide();
        $('#softphone-status .notready').addClass("disabled").show();
      },
      callOut: function(){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').removeClass("disabled");
        
        $('#softphone-status .hold').addClass("disabled").show();;
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').addClass("disabled");
        $('#softphone-makecall').addClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
  
        $('#softphone-status .ready').addClass("disabled").hide();
        $('#softphone-status .notready').addClass("disabled").show();
      },
      hungup: function(){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').addClass("disabled");
        
        $('#softphone-status .hold').addClass("disabled").show();;
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').addClass("disabled");
        $('#softphone-makecall').removeClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
        
        $('#softphone-status .ready').addClass("disabled").hide();
        $('#softphone-status .notready').removeClass("disabled").show();
      },
      accepted: function (response, cause){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').removeClass("disabled");
        
        $('#softphone-status .hold').removeClass("disabled").show();
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').removeClass("disabled");
        $('#softphone-makecall').addClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
  
        $('#softphone-status .ready').addClass("disabled").hide();
        $('#softphone-status .notready').addClass("disabled").show();
      },
      hold: function (){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').addClass("disabled");
        
        $('#softphone-status .hold').addClass("disabled").hide();
        $('#softphone-status .unhold').removeClass("disabled").show();
  
        $('#softphone-trans').addClass("disabled");
        $('#softphone-makecall').removeClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
  
        $('#softphone-status .ready').addClass("disabled").hide();
        $('#softphone-status .notready').addClass("disabled").show();
      },
      unhold: function (){
        $('.soft-function,.status').removeClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').removeClass("disabled");
        
        $('#softphone-status .hold').removeClass("disabled").show();
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').removeClass("disabled");
        $('#softphone-makecall').addClass("disabled");
  
        $('#ukefu_account .login').hide();
        $('#ukefu_account .logout').show();
  
        $('#softphone-status .ready').addClass("disabled").hide();
        $('#softphone-status .notready').addClass("disabled").show();
      },
      logout: function (){	
        $('.status').addClass("disabled");	
        $('#softphone-answer').addClass("disabled");
        $('#softphone-hungup').addClass("disabled");
        
        $('#softphone-status .hold').addClass("disabled").show();
        $('#softphone-status .unhold').addClass("disabled").hide();
  
        $('#softphone-trans').addClass("disabled");
        $('#softphone-makecall').addClass("disabled");
  
        $('#softphone-status .ready').addClass("disabled").show();
        $('#softphone-status .notready').addClass("disabled").hide();
  
        $('#ukefu_account .login').removeClass("disabled").show();
        $('#ukefu_account .logout').addClass("disabled").hide();
      },
      initCallStatus: function(session , called){
        console.log('session', session);
        $('#caller .number').text(session._request.from._uri._user);
        if (called) {
          $('#called .number').text(session._request.to._uri._user);
        }
      }
    }
  }

  function getUseMediaSuccess(stream) {
    mediaStream = stream
    console.log('getUserMedia success', e)
  }

  function getUserMediaFailure(e) {
    console.log('getUserMedia failed', e)
  }
  

})



