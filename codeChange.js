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
var changedMdCount =0;
var mdCount = 0;

SelfScript.self['macrosВставить проверку на ОбменДанными.Загрузка в методы ПередЗаписью и ПриЗаписи для всех модулей 1С'] = function() {

	stopped = false
	changedMdCount =0;
	mdCount = 0;

	res = stdlib.forAllMdObjects(metadata.current.rootObject, AddCodeIntoMetadataModuleText);
	
	if(mdCount != changedMdCount)
		Message("Изменено "+changedMdCount+" модулей. Всего "+mdCount+" модулей, которые требуется изменить. Не удалось изменить "+(mdCount - changedMdCount) +" модулей!")
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
					sourceText = mdObj.getModuleText(mdPropName);
					if(sourceText.length){
						var str = "	" + mdObj.parent.name + " - " +mdc.name(1) + formName + "." + mdObj.name + "." + mdPropName
						Status(str)
						logger.debug(str)
						
						var successMessage = mdc_name + "." + mdObj_name + formName + "." + mdPropName
						
						context = SyntaxAnalysis.AnalyseModule(sourceText, true);

						var isSetModuleText = false
						var haveMethod = false
						
						var data = getNewMethodCode(context, "ПередЗаписью", sourceText, successMessage);
						if (!haveMethod && data.HaveMethod){
							haveMethod = true
							mdCount++
						}
							
						if (data.Success){
							isSetModuleText = true
							sourceText = data.NewText;
							context = SyntaxAnalysis.AnalyseModule(sourceText, true);
						}
						
						var data = getNewMethodCode(context, "ПриЗаписи", sourceText, successMessage);
						if (!haveMethod && data.HaveMethod){
							haveMethod = true
							mdCount++
						}
						
						if (data.Success){
							isSetModuleText = true
							sourceText = data.NewText;
							context = SyntaxAnalysis.AnalyseModule(sourceText, true);
						}
						
						if (isSetModuleText) {
							try{
								mdObj.setModuleText(mdPropName, sourceText);
								changedMdCount++
								var str = ""+changedMdCount + ": " + mdc_name + "." + mdObj_name + formName + "." + mdPropName+ " - поменял методы - добавил проверку на ОбменДанными.Загрузка"
								Message(str)
								logger.debug(str)
							}catch(e) {
								logger.error("Ошибка изменения текста: " + mdc_name + "." + mdObj_name + formName + "." + mdPropName)
							}
							
							Status("")
							//stopped = true
							//return
						}
					}
				}
		    }
			
		}
		catch(e){
            logger.error("Ошибка: "+e.description)
			try{
				logger.error("		Метаданное с ошибкой: "+ mdObj.parent.name + " - " +mdc_name + "." + mdObj_name + "." + mdPropName)
			}catch(e){}
		}
	}
}

function getNewMethodCode(context, methodName, sourceText, successMessage){
	var res = { Success: false, NewText: null, HaveMethod : false };
	
	var re = new RegExp("^[^/]*(\\s*Если\\s+ОбменДанными\\.Загрузка\\s+Тогда\\s+Возврат\\s*;?\\s+КонецЕсли\\s*;?)");
	
	var method = context.getMethodByName(methodName);
		
	if (method){
		res.HaveMethod = true
			
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
			res.Success = true;
			
			Status("")
			var str = "		" + successMessage + " - нужно поменять метод "+methodName+""
			Message(str)
			logger.debug(str)
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
