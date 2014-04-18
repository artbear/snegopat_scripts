$engine JScript
$uname test_xUnitAddTestsDesc
$dname Тесты работы xUnitAddTestsDesc.js
$addin global
$addin stdcommands
$addin stdlib

//global.connectGlobals(SelfScript);

// регулярка для поиска всех функций JScript - удобно юзать в Notepad++ 
//      ^function\s*([^\(]+)\(
//      (^function\s*[^\(\s]+\s*\()|(^[^\.\s]+\.prototype\.[^\.\s]+\s+)

stdlib.require('jsUnitCore.js', SelfScript);

var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
var testDir = mainFolder + 'scripts\\Tests\\Automated\\xUnitFor1C\\AddTestsDesc\\';
var pluginAppender = stdlib.require(mainFolder + 'scripts\\xUnitAddTestsDesc.js'); //, SelfScript); // чтобы вызывать функции из основного скрипта

var TWW = stdlib.require('TextWindow.js');

var textDoc = null;
var twnd = null;
    
var appender = null;

function setUp()
{
    textDoc = v8New("TextDocument");
	var text = "Таб = Новый ТаблицаЗначений;\nТаб";
    textDoc.SetText(text);

    textDoc.Show();
    
    twnd = TWW.GetTextWindow();

    appender = new pluginAppender._AppenderTestCaseDescriptionsIntoText(twnd);
}

function tearDown()
{
    destroyTextWindow();
}

function destroyTextWindow()
{
    if (twnd)
        delete twnd;
    
    // Чтобы при закрытии не выдавалось сообщение "Записать?", сохраним документ во временный файл.
    var tempFile = globalContext("{4A993AB7-2F75-43CF-B34A-0AD9FFAEE7E3}").GetTempFileName();
    textDoc.Write(tempFile);
    
    // Закроем окно текстового документа.
    stdcommands.Frame.FileClose.send();    
    
    // Удалим временный файл.
    var f = v8New("File", tempFile);
    globalContext("{22A21030-E1D6-46A0-9465-F0A5427BE011}").DeleteFiles(f.Path, f.Name);
}

SelfScript.self['macrosTest В модуле уже есть описания тестовых случаев'] = function() {

    var textDoc = v8New("TextDocument");
	textDoc.Read(testDir+'xUnitAddTestsDesc_УжеЕстьОписанияТестов.txt')
	
	var predLineCount = textDoc.LineCount();
	var text = textDoc.GetText();
	twnd.SetText(text)
	
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames.length, 2);
		
	var procName = 'ТестСОпциями_БезПараметра'
		var reTestCaseDesc = new RegExp( '^\\s*ВсеТесты\\.Добавить\\(\\s*"'+procName+'"\\s*\\)\\s*;\\s*$', "igm");
		assertFalse('Не нашли описание теста '+procName, reTestCaseDesc.test(text));
	
	success = appender.addTestCaseDescriptionsIntoText();
		assertTrue('Не успешно выполнили тест!', success);
		assertEquals(twnd.LinesCount(), predLineCount+2);
		
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames.length, 2);
		
	var text = twnd.GetText();
	
	for(i=0; i < procNames.length; i++) {
		var reTestCaseDesc = new RegExp( '^\\s*ВсеТесты\\.Добавить\\(\\s*"'+procNames[i]+'"\\s*\\)\\s*;\\s*$', "igm");
			//logger.debug('Регулярное выражение шаблона замены '+reTestCaseDesc.source)
		assertTrue('Не нашли описание теста '+procNames[i], reTestCaseDesc.test(text));
	}

		//var txt = "перем Пример;\nПример = 2;";
		//var arrStrings = txt.split("\n");
		//assertTrue('Не успешно выполнили тест!', obInts.removeComments(arrStrings));
}

SelfScript.self['macrosTest В модуле вообще нет функции ПолучитьСписокТестов, но сами тестовые случаи определены'] = function() {
	//pluginAppender.logger.setLevel(pluginAppender.Log4js.Level.DEBUG);
	
    var textDoc = v8New("TextDocument");
	textDoc.Read(testDir+'xUnitAddTestsDesc_НетПолучитьСписокТестов.txt')
	
	predLineCount = textDoc.LineCount()
	var text = textDoc.GetText();
	twnd.SetText(text)
	
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames.length, 2);
		
	var procName = 'ТестСОпциями_БезПараметра'
		var reTestCaseDesc = new RegExp( '^\\s*ВсеТесты\\.Добавить\\(\\s*"'+procName+'"\\s*\\)\\s*;\\s*$', "igm");
		assertFalse('Не нашли описание теста '+procName, reTestCaseDesc.test(text));
	
	success = appender.addTestCaseDescriptionsIntoText();
		assertTrue('Не успешно выполнили тест!', success);
		assertEquals(twnd.LinesCount(), predLineCount + 15);
		
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames.length, 2);
		
	var text = twnd.GetText();
	
	for(i=0; i < procNames.length; i++) {
		var reTestCaseDesc = new RegExp( '^\\s*ВсеТесты\\.Добавить\\(\\s*"'+procNames[i]+'"\\s*\\)\\s*;\\s*$', "igm");
			//logger.debug('Регулярное выражение шаблона замены '+reTestCaseDesc.source)
		assertTrue('Не нашли описание теста '+procNames[i], reTestCaseDesc.test(text));
	}
}

SelfScript.self['macrosTest В модуле вообще нет тестовых случаев'] = function() {
	
    var textDoc = v8New("TextDocument");
	textDoc.Read(testDir+'xUnitAddTestsDesc_НетОпределенийТестов.txt')
	
	predLineCount = textDoc.LineCount()
	predText = textDoc.GetText()
	twnd.SetText(predText)
	
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames, null);
	
	success = appender.addTestCaseDescriptionsIntoText();
		assertFalse('Не успешно выполнили тест!', success);
		assertEquals(predText, textDoc.GetText());
		//assertEquals(TrimAll(predText), TrimAll(textDoc.GetText()));
		assertEquals(twnd.LinesCount(), predLineCount);
	
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames, null);
		
}

function TrimAll(src) {
    return src.replace(/(^\s*)|(\s*$)/g, ""); //trim
}
