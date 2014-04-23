$engine JScript
$uname ПереборМодулей
$dname Перебор модулей 1С из конфигурации
$addin global
$addin stdlib
$addin stdcommands

stdlib.require('SyntaxAnalysis.js', SelfScript);
stdlib.require('log4js.js', SelfScript);
global.connectGlobals(SelfScript);

var logger = addLogger(SelfScript.uniqueName, Log4js.Level.ERROR); //Log4js.Level.DEBUG

var stopped = false
var changedCount =0;
var mdCount = 0;

SelfScript.self['macrosПеребрать все модули 1С из конфигурации'] = function() {

	stopped = false
	changedCount =0;
	mdCount = 0;

	res = stdlib.forAllMdObjects(metadata.current.rootObject, AddCodeIntoMetadataModuleText);
	if(mdCount != changedCount)
		Message("Изменено "+changedCount+" модулей. Всего "+mdCount+" модулей, которые требуется изменить. Не удалось изменить "+(mdCount - changedCount) +" модулей!")
	else
		Message("Удалось изменить все модули. Всего "+mdCount+" модулей!")
}

function AddCodeIntoMetadataModuleText(mdObj){
	if (!stopped){
		var str = mdObj.mdclass.name(1) + "." + mdObj.name
		Status(str)
		logger.debug(str)
		
		var mdObj_name = mdObj.name;
			
		var mdc = mdObj.mdclass;
		var mdc_name = mdc.name(1)
		var formName = ""
		// для объектов форм по умолчанию не показываются полные имена метаданных, приходится специально вычислять метаданное
		if (mdc_name == "Форма") { 
			formName = "."+mdObj_name
			mdObj_name = mdObj.parent.name;
			mdc_name = mdObj.parent.mdclass.name(1);
			var str = "		" + mdObj.parent.name + " - " +mdc_name + "." + mdObj_name
			Status(str)
			logger.debug(str)
		}
		try{
		    for(var i = 0, c = mdc.propertiesCount; i < c; i++)
		    {
		        var mdProp = mdc.propertyAt(i)

		        var mdPropName = mdProp.name(1);
		        if(mdObj.isPropModule(mdPropName)) {
					//logger.debug("		" + mdPropName)
					//Status(mdObj.parent.name + " - " +mdc_name + "." + mdObj_name + "." + mdPropName)
					sourceText = mdObj.getModuleText(mdPropName);
					if(sourceText.length){
						var str = "	" + mdObj.parent.name + " - " +mdc.name(1) + formName + "." + mdObj.name + "." + mdPropName
						Status(str)
						logger.debug(str)
						
						context = SyntaxAnalysis.AnalyseModule(sourceText, true);
						
						var data = getNewMethodCode(context, "ПередЗаписью", sourceText);
						if (data.HaveMethod)
							mdCount++
						var newText = data.NewText
						if (newText) {
							try{
								mdObj.setModuleText(mdPropName, newText);
								changedCount++
								var str = ""+changedCount+" " + mdc_name + "." + mdObj_name + formName + "." + mdPropName+ " - поменял метод "+methodName+" - добавил проверку на ОбменДанными.Загрузка"
								Message(str)
								logger.debug(str)
							}catch(e) {
								logger.error("Ошибка изменения текста: " + mdc_name + "." + mdObj_name + formName + "." + mdPropName+ " - метод "+methodName+"")
							}
							
							//stopped = true
							Status("")
						}
						//}
						
						////methodName = "ПередЗаписью"
						//var method = context.getMethodByName(methodName);
						//var haveMethod = method ? true : false;
						//if (haveMethod){
						//	mdCount++
						//	//if(changedCount < 2){
						//		//logger.debug("	ПередЗаписью");
						//		
						//		Lines = sourceText.split("\n");
						//		methodLines = Lines.slice(method.StartLine, method.EndLine+1);
						//		methodText = methodLines.join("\n");
						//		
						//		if(!re.test(methodText)) {
						//			//logger.debug("sourceText <"+ sourceText+">\n");
						//			//logger.debug("methodText <"+ methodText+">\n");
						//			
						//			beforeLines = Lines.slice(0, method.StartLine+1);
						//			afterLines = Lines.slice(method.StartLine+1);
						//			
						//			newLines = "\n\n\tЕсли ОбменДанными.Загрузка Тогда Возврат; КонецЕсли;\n\n";
						//			newText = beforeLines.join("\n")+ newLines + afterLines.join("\n");
						//			//logger.debug("newText <"+ newText+">\n");
						//			//logger.debug("re.test(newText) <"+ re.test(newText)+">\n");
						//			
						//			try{
						//				mdObj.setModuleText(mdPropName, newText);
						//				changedCount++
						//				var str = ""+changedCount+" " + mdc_name + "." + mdObj_name + formName + "." + mdPropName+ " - поменял метод "+methodName+" - добавил проверку на ОбменДанными.Загрузка"
						//				Message(str)
						//				logger.debug(str)
						//			}catch(e) {
						//				logger.error("Ошибка изменения текста: " + mdc_name + "." + mdObj_name + formName + "." + mdPropName+ " - метод "+methodName+"")
						//			}
						//			
						//			//stopped = true
						//			Status("")
						//			//return
						//		}
						//	//}
						//	//changedCount++
						//}
						////var method = context.getMethodByName("ПриЗаписи");
					}
				}
		    }
			
				//sourceText = mdObj.getModuleText("МодульОбъекта");
				//if(sourceText.length){
				//	context = SyntaxAnalysis.AnalyseModule(sourceText, true);
				//	var method = context.getMethodByName("ПередЗаписью");
				//	if (!method){
				//		//newText = sourceText + "\nПроцедура ПередЗаписью(Отказ)\n Если ОбменДанными.Загрузка Тогда \n   Возврат;\n КонецЕсли; \nКонецПроцедуры"
				//	} else {
				//			//Lines = sourceText.split("\n");
				//			//beforeLines = Lines.slice(0, method.StartLine+1);
				//			//afterLines = Lines.slice( method.StartLine+2);
				//			//
				//			//newLines = "\n Если ОбменДанными.Загрузка Тогда \n   Возврат;\n КонецЕсли;";
				//			//newText = beforeLines.join("\n")+"\n" + mdObj.newText+"\n"+ afterLines.join("\n");
				//			//
				//			//}
				//			//mdObj.setModuleText("МодульОбъекта", newText);
				//		
				//		
				//		logger.debug(""+changedCount+"Есть МодульОбъекта.ПередЗаписью " + mdObj.mdclass.name(1) + "." + mdObj.name)
				//		changedCount++
				//	}
				//}
		}
		catch(e){
            logger.error("Ошибка: "+e.description)
			try{
				logger.error("		Метаданное с ошибкой: "+ mdObj.parent.name + " - " +mdc_name + "." + mdObj_name + "." + mdPropName)
			}catch(e){}
		}
	}
}

function getNewMethodCode(context, methodName, sourceText){
	var res = { NewText: null, HaveMethod: false };
	
	var re = new RegExp("^[^/]*(\\s*Если\\s+ОбменДанными\\.Загрузка\\s+Тогда\\s+Возврат\\s*;?\\s+КонецЕсли\\s*;?)");
	
	var method = context.getMethodByName(methodName);
	res.HaveMethod = method ? true : false;
	if (res.HaveMethod){
		//mdCount++
			
		Lines = sourceText.split("\n");
		methodLines = Lines.slice(method.StartLine, method.EndLine+1);
		methodText = methodLines.join("\n");
		
		if(!re.test(methodText)) {
			//logger.debug("sourceText <"+ sourceText+">\n");
			//logger.debug("methodText <"+ methodText+">\n");
			
			beforeLines = Lines.slice(0, method.StartLine+1);
			afterLines = Lines.slice(method.StartLine+1);
			
			newLines = "\n\n\tЕсли ОбменДанными.Загрузка Тогда Возврат; КонецЕсли;\n\n";
			newText = beforeLines.join("\n")+ newLines + afterLines.join("\n");
			//logger.debug("newText <"+ newText+">\n");
			//logger.debug("re.test(newText) <"+ re.test(newText)+">\n");
			
			res.NewText = newText;
			Status("")
		}
	}
	return res
}

function addLogger(loggerName, logLevel) {
	var logger = Log4js.getLogger(loggerName);
	var appender = new Log4js.BrowserConsoleAppender();
	appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
	// следующий код нужен, чтобы при перезапуске скрипта без перезапуска Конфигуратора лог не задвоится
	appenders = [];
	appenders.push(appender);
	logger.onlog = new Log4js.CustomEvent();
	logger.onclear = new Log4js.CustomEvent();

	logger.setAppenders(appenders); // конец блока исключения задвоения лога
	//logger.addAppender(new Log4js.FileAppender("f:\\somefile.log"));
	logger.setLevel(logLevel);
	return logger;
}
