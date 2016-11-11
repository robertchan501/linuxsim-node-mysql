$(document).ready(function() {
	var terminal_obj = null;
	var join_data = null;
	var session_id = $('html').attr('data-session');
	var step_round = 0;

/* email check */
function validateEmail($email) {
  var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  return emailReg.test( $email );
}
/* when user login, value used on users table */
function current_date(){
	var fullDate = new Date();
	//convert month to 2 digits
	var twoDigitMonth = ((fullDate.getMonth().length+1) === 1)? (fullDate.getMonth()+1) :(fullDate.getMonth()+1);
	var currentDate = fullDate.getFullYear() + "-" + twoDigitMonth + "-" + fullDate.getDate()+" "+fullDate.getHours()+':'+fullDate.getMinutes()+':'+fullDate.getSeconds();
	return currentDate;
}

function scroll_position(element, event){
	if(event == 'next')
	{
		var li_outerHeight = element.outerHeight(true);
		var li_order = element.index() + 1;
	} else {
		var li_outerHeight = element.outerHeight(true);
		var li_order = element.index() - 1;
	}
	console.log(li_order);

	return li_outerHeight * li_order;
}
	// if(location.pathname != '/') {  //Display terminal into modules page

	if((location.pathname == '/modules') || (location.pathname == '/exercises')) {
		
		/*------------------------ auto terminal section ----------------------------*/
	    terminal_obj = $('#term_demo').terminal(function(command, term){
	        if(command == '') return;

	        var getUrl = window.location;
			var baseUrl = getUrl.protocol + "//" + getUrl.host + '/modules-exercises';

	        var data = {};
	        data.id = $('#sidebar').find('.do_active').attr('row_id');
	        console.log(data.id);
	        if(location.pathname == '/modules') {
	        	data.page = "modules";
	        	$.ajax({
					type: 'POST',
					data: JSON.stringify(data),
			        contentType: 'application/json',
		            url: baseUrl,
		            success: function(data) {
			            if (command == data[0].command) {
				            try {
				                term.echo(data[0].result, {
		    						finalize: function(div){
		    							div.css('color','chartreuse');
		    						}
		    					});
		    					term.echo('exercise has done!');
	    						terminal_obj.pause();
				                /*terminal_obj.set_prompt('$ ' + data[0].result);*/
				            } catch(e) {
				                term.echo('Invalid command entered.', {
			    					finalize: function(div){
			    						div.css('color','red');
			    					}
			    				});
				            }
					    } else {
					    	term.echo('Invalid command entered.', {
		    					finalize: function(div){
		    						div.css('color','red');
		    					}
		    				});
					    }
		            },
		            error: function(data){
		            	console.log('Error: ',data);
		            }
			    });
	    	} else {		/******   exercise page   ******/
	    		if(step_round < join_data.length){
	    			if(join_data[step_round].command == command){
	    				term.echo(join_data[step_round].result, {
    						finalize: function(div){
    							div.css('color','chartreuse');
    						}
    					});
    					$('.taskbar p').eq(step_round).css('background-color','lavender');
	    				step_round++;
	    				var width = 100 / join_data.length * step_round;
	    				$('.progress-bar').css('width', width + '%');
	    				$('.flags span').eq(1).removeClass('incorrect');
			            $('.flags span').eq(0).addClass('correct');
	    			} else {
	    				term.echo('Invalid command entered.', {
	    					finalize: function(div){
	    						div.css('color','red');
	    					}
	    				});
	    				$('.flags span').eq(0).removeClass('correct');
					    $('.flags span').eq(1).addClass('incorrect');
	    			}
	    		} 
	    		if(step_round == join_data.length){
	    			term.echo('exercise has done!');
	    			terminal_obj.pause();
	    		}
	    	}

	    }, {
	        greetings: 'Welcome to LinuxSim',
	        name: 'js_demo',
	        height: 500,
	        prompt: '$ '
	    });
	}

/*	On click a tab of the modules or exercises	*/
    $('.sidebar-wrapper').on('click', 'li', function(){
		var id = $(this).attr('row_id');
		switch(location.pathname){
			case '/':
				if(session_id > 0) {
					$('#form_modules').append("<input type='hidden' name='row_id' value='"+ id +"'>");
					$('#form_modules').append("<input type='hidden' name='page' value='index'>");
					$('#form_modules').submit();
				} else {
					location.href = window.location.protocol+ "//" + window.location.host + '/Login';
				}
				break;
			case '/modules':
				if($(this).hasClass('active_new')) return;

				if(session_id == '') location.href = window.location.protocol+ "//" + window.location.host + '/Login';

				if($('#term_demo').length == 0){
					var form_html = "";
					form_html = '<form id="add_form" action="/modules" method="POST">';
					form_html += '<input type="hidden" name="row_id" value="'+ id +'">';
					form_html += '<input type="hidden" name="page" value="index">';
					form_html += '</form>';
					$(form_html).appendTo($('.content-module-x'));
					$('#add_form', '.content-module-x').submit();
				}
				var data = {};
				data.row_id = id;
				data.page = 'modules';
				var that = this;

				$.ajax({
					type: 'POST',
					data: JSON.stringify(data),
					contentType: 'application/json',
					url: window.location.pathname,
					success: function(data) {
						$('.sidebar-wrapper').find('.do_active').removeClass('do_active');
						$(that).addClass('do_active');
						$('#page-title').text(data[0].title);
						$('.description').text(data[0].description);
						terminal_obj.resume();
						terminal_obj.reset().focus();
					},
					error: function(data){
						console.log('Error: ',data);
					}
				});
				break;
			case '/exercises':
				if(session_id == '') location.href = window.location.protocol+ "//" + window.location.host + '/Login';

				if($('#term_demo').length == 0){ //the status is not login.
					var form_html = "";
					form_html = '<form id="add_form" action="/exercises" method="POST">';
					form_html += '<input type="hidden" name="id" value="'+ id +'">';
					form_html += '<input type="hidden" name="page" value="index">';
					form_html += '</form>';
					$(form_html).appendTo($('#exercises'));
					$('#add_form', '#exercises').submit();
				}
				var data = {};
				data.id = id;
				var that = this;

				$.ajax({
					type: 'POST',
					data: JSON.stringify(data),
					contentType: 'application/json',
					url: window.location.pathname,
					success: function(data) {
						$('.sidebar-wrapper').find('.do_active').removeClass('do_active');
						$(that).addClass('do_active');

						join_data = data[0];
						step_round = 0;
						/*console.log(join_data);*/
						if(join_data.length > 0){
							var step_content = "";
							$.each(data[0], function(index, value){
								if(!value.step_title == '')
								{
									step_content += '<p>';
									step_content += value.step_title;
									step_content += '</p>';
								}
							});
							//$('#page-title').text(data[1][0].title);
							$('.taskbar').html(step_content);
							$('.cursor').addClass('blink');
							terminal_obj.resume();
							terminal_obj.reset().focus();
						} else {
							return;
						}
					},
					error: function(data){
						console.log('Error: ',data);
					}
				});
				break;
			default:
				break;
		}
    });


    $('.btn-next').click(function(){
    	var active = $("#sidebar li.do_active");
		if(active.next().attr('row_id') > 0){

			$('#sidebar').animate({scrollTop: scroll_position(active, "next")}, 500);
			
			$('.progress-bar').css('width', '0');
			active.removeClass('do_active');
			active.next().trigger('click');
		} else {
			$("#sidebar li").eq(0).trigger('click'); /* to first element*/
		}
    });

    $('.btn-prev').click(function(){
    	var active = $("#sidebar li.do_active");
    	if(active.prev().attr('row_id') > 0){
    		$('#sidebar').animate({scrollTop: scroll_position(active, "prev")}, 100);
    		$('.progress-bar').css('width', '0');
    		active.removeClass('do_active');
			active.prev().trigger('click');
    	} else {
    		$("#sidebar li").eq(0).trigger('click'); /* to first element*/
    	}
    });

/*	auto focus on terminal plugin	*/
    $('#term_demo').click(function(){
    	terminal_obj.focus();
    });
/*	auto active on nav-menu	*/
    switch(location.pathname){
    	case '/':
    		$('.menu-item a').find('.active').removeClass('active');
    		$('#menu-item-1 a').addClass('active');
    		break;
    	case '/modules':
    		$('.menu-item a').find('.active').removeClass('active');
    		$('#menu-item-2 a').addClass('active');
    		break;
    	case '/exercises':
    		$('.menu-item a').find('.active').removeClass('active');
    		$('#menu-item-3 a').addClass('active');
    		$('.progress-bar').css('width', '0');
    		break;
    	case '/contact':
    		$('.menu-item a').find('.active').removeClass('active');
    		$('#menu-item-4 a').addClass('active');
    		break;
    	case '/login':
    		$('.menu-item a').find('.active').removeClass('active');
    		$('#menu-item-5 a').addClass('active');
    		$('.login-username').focus();
    		break;
    	case '/signup':
    		$('.menu-item a').find('.active').removeClass('active');
    		$('#menu-item-6 a').addClass('active');
    		$('.yourname').focus();
    }
/*=====================================		SignUp page	=======================================*/
    $('.btn-submit').click(function(e){
    	e.preventDefault();
    	e.stopPropagation();

    	var yourname = $('.yourname').val();
    	var youremail = $('.youremail').val();
    	var yourusername = $('.yourusername').val();
    	var password = $('.password').val();
    	var confirmpassword = $('.confirmpassword').val();

    	if(yourname == ''){
    		if(confirm('Please enter your name.')){
    			$('.yourname').addClass('warning');
    			$('.yourname').focus();
    		}
    		return;
    	}
    	if(youremail == ''){
    		if(confirm('Please enter your Email.')){
    			$('.youremail').addClass('warning');
    			$('.youremail').focus();
    		}
    		return;
    	} else {
    		if(!validateEmail(youremail)){
    			if(confirm('Please enter exactly your Email.')){
	    			$('.youremail').val('');
	    			$('.youremail').addClass('warning');
	    			$('.youremail').focus();
	    		}	
    			return;
    		}
    	}
    	if(yourusername == ''){
    		if(confirm('Please enter your username.')){
    			$('.yourusername').addClass('warning');
    			$('.yourusername').focus();
    		}
    		return;
    	}
    	if(password == ''){
    		if(confirm('Please enter your password.')){
    			$('.password').addClass('warning');
    			$('.password').focus();
    		}
    		return;
    	}
    	if(confirmpassword == ''){
    		if(confirm('Please enter your confirmpassword.')){
    			$('.confirmpassword').addClass('warning');
    			$('.confirmpassword').focus();
    		}
    		return;
    	}
    	if(password != confirmpassword){
    		$('.password').val('');
    		$('.confirmpassword').val('');
    		if(confirm('Please enter your password.')){
    			$('.password').addClass('warning');
    			$('.password').focus();
    		}
    		return;
    	}

    	var data = {};
    	data.username = yourusername;
    	data.email = youremail;
    	data.password = $.md5(password);
    	data.fullname = yourname;
    	data.created = 	current_date();
    	console.log(JSON.stringify(data));
    	$.ajax({
    	type: 'POST',
		data: JSON.stringify(data),
        contentType: 'application/json',
        url: window.location.pathname,
        success: function(data) { console.log('data-status: '+data.status);
            switch(data.status){
            	case "OK":
            		location.href = window.location.protocol+ "//" + window.location.host + '/paypal_active';  // call to home page
            		break;
            	case "EXISTING":
            		$('.yourname').val("");
            		$('.youremail').val("");
            		$('.yourusername').val("");
					$('.password').val("");
					$('.confirmpassword').val("");
					/*var warning = '<bold>You can not register your info because it is existing already. Please try entering again.</bold>';
					warning.appendTo($('#content'));*/
					location.href = window.location.protocol+ "//" + window.location.host + '/paypal_active';
            		break;
            	case 'USING':
            		if(confirm("You are using this info now. Please go to login page.")) location.href = location.href = window.location.protocol+ "//" + window.location.host + '/login';
            		break;
            	default:
            		break;
            }
        },
        error: function(data){
        	console.log('Error: ',data);
        }	
    	});
    });
/*	On change, auto remove warning	*/
    $('.signup-page').on('change', '.signup',function(){
    	if($(this).hasClass('warning')){
    		$(this).removeClass('warning');
    		if(confirm('Please enter your password.')){
    			$('.password').addClass('warning');
    			$('.password').focus();
    		}
    		return;
    	}
    });
/*=====================================		Login page	=======================================*/	
    $('.btn-login').click(function(e){
    	e.preventDefault();
    	e.stopPropagation();

    	var login_username = $('.login-username').val();
    	var login_password = $('.login-password').val();
    	if(login_username == ''){
    		if(confirm('Please enter username/emailaddress.')){
    			$('.login-username').addClass('warning');
    			$('.login-username').focus();
    		}
    		return;
    	}
    	if(login_password == ''){
    		if(confirm('Please enter password.')){
    			$('.login_password').addClass('warning');
    			$('.login_password').focus();
    		}
    		return;
    	}

    	var data = {};
    	if(validateEmail(login_username)){
    		data.email = login_username;
    	} else {
    		data.username = login_username;
    	}	
    	data.password = $.md5(login_password);
    	$.ajax({
    	type: 'POST',
		data: JSON.stringify(data),
        contentType: 'application/json',
        url: window.location.pathname,
        success: function(data) {	        
            switch(data.status){
            	case 'ON':
            		location.href = window.location.protocol+ "//" + window.location.host + '/';
            		break;
            	case 'OFF':
            		if(confirm('You have to pay through Paypal if you want to do continuously.')){
	            		location.href = window.location.protocol+ "//" + window.location.host + '/signup';
	            	}
            		return;
            	case 'NO':
            		if(confirm('You have to Signup right soon.')){
	            		location.href = window.location.protocol+ "//" + window.location.host + '/signup';
	            	}
            		return;
            	default:
            		break;
            }
        },
        error: function(data){
        	console.log('Error: ',data);
        }	
    	});
    });

    if(terminal_obj != null){
		terminal_obj.pause(true);
	}
    if($('html').attr('data-session') > 0){
    	$('#menu-item-5 a').text('Logout');
    	$('#menu-item-5 a').attr('href','#');
    }
    $('#menu-item-5 a').click(function(e){
    	if($(this).text() == 'Logout'){    		
    		var data = {};
    		data.session_id = $('html').attr('data-session');
    		$.ajax({
    			type: 'POST',
    			data: JSON.stringify(data),
    			contentType: 'application/json',
    			url: window.location.protocol+ "//" + window.location.host + '/logout',
    			success: function(data){
    				if(data.status == 'SUCCESS'){
    					location.href = window.location.protocol+ "//" + window.location.host + '/login';
    				}
    			},
    			error: function(data){
    				console.log('error: ' + data);
    			}
    		});
    	}
    });
});

