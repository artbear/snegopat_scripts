﻿$engine JScript
$uname SelectValueDialog
$dname Класс SelectValueDialog
$addin global
$addin stdcommands
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт-библиотека SelectValueDialog (SelectValueDialog.js) для проекта "Снегопат"
////
//// Описание: Диалог выбора значения из списка с фильтрацией элементов. 
//// Пример использования см. в скрипте Tests\Examples\SelectValueDialog_example.js
//// Может наследоваться.
////
//// Автор: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
////}
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

stdlib.require("ScriptForm.js", SelfScript);
stdlib.require("TextChangesWatcher.js", SelfScript);
stdlib.require("TextWindow.js", SelfScript);

SelectValueDialog = ScriptForm.extend({

    caption: "Выберите значение",

    settingsRootPath : 'SelectValueDialog',
    
    settings : {
        pflSnegopat : {
            'DoNotFilter': false, 
            'SortByName' : false
        }
    },

    construct : function (caption, values) {    
        this._super(stdlib.getSnegopatMainFolder() + "scripts\\Libs\\SelectValueDialog.ssf");
        if (!values) {
        	values = [];
        }
        this.loadValues(values);
        this.caption = caption;
        this.form.ValuesList.Columns.Add('Value');
        this.setValuesList(this.originalList);
        
        var sv = this;
        this.tcWatcher = new TextChangesWatcher(this.form.Controls.SearchText, 3, function(t){sv.updateList(t)});
    },

    selectValue: function (values) {
        if (values) {
            this.loadValues(values);
        }
        this.selectedValue = this.form.DoModal();
        return this.selectedValue ? true : false;
    },

    addRowToVT: function(vt, value, name) {
        var newRow = vt.Add();
        newRow.Order = vt.Count();
        newRow.Value = value;
        newRow.Name = '' + (name ? name : value);		
    },

    loadValues: function (values) {
        var vt = v8New('ValueTable');
        vt.Columns.Add('Name');
        vt.Columns.Add('Order');
        vt.Columns.Add('Value');
        
        //TODO: добавить поддержку соответствия и структуры.
        var typeName = Object.prototype.toString.call(values);
        if (typeName === '[object Array]') {
            for (var i=0; i<values.length; i++) {
                this.addRowToVT(vt, values[i]);
            }
        } else if (typeName === '[object Object]') {			
            // Или объект 1С, или объект JavaScript.
            typeName = toV8Value(values).typeName(0);
            if (typeName === 'COMObject') { 
                // Значит, это объект JavaScript или COM-объект. 
                // Ключ - представление, значение - значение.
                for (var prop in values) {
                    if (values.hasOwnProperty(prop)) {
                        this.addRowToVT(vt, values[prop], prop);
                    }
                }
            } else if (typeName === 'ValueList') {
                // TODO: картинку тоже можно показывать!
                for (var i=0; i<values.Count(); i++) {
                    var el = values.Get(i);
                    this.addRowToVT(vt, el.Value, el.Presentation);
                }
            } else if (typeName === 'Array') {
                for (var i=0; i<values.Count(); i++) {
                    this.addRowToVT(vt, values.Get(i));
                }
            } else {
                // Переданный параметр - не поддерживаемая коллекция.
                // Тогда в списке только одно переданное значение.
                this.addRowToVT(vt, values);
            }		
        } else {
            this.addRowToVT(vt, values);
        }
                
        this.sortValuesList(this.form.SortByName, vt);
        this.originalList	= vt;
        return vt;
    },

    sortValuesList: function (sortByName, vt) {
        if (!vt) {
            vt = this.form.ValuesList;
        }
        vt.Sort(sortByName ? 'Name' : 'Order');
    },

    setValuesList: function(vt) {
        this.form.ValuesList = vt.Copy();
    },

    updateList: function (newText) {
    
        if (!newText || newText.match(/^\s*$/))
        {
            if (this.loadedOnOpen)
                this.loadedOnOpen = false;
            else
            	this.setValuesList(this.originalList);
        }
        else 
        {
            var a = newText.split(/\s+/);
            for (var i=0; i<a.length; i++)
                a[i] = StringUtils.addSlashes(a[i]);
                
            var re = new RegExp(a.join(".*?"), 'i');    
            
            if (this.form.DoNotFilter)
            {
                var currentRow = undefined;
                
                var vtList = this.originalList.Copy();
                for (var rowNo = 0; rowNo < vtList.Count(); rowNo++)
                {
                    var row = vtList.Get(rowNo);
                    if (re.test(row.Name))
                    {
                        currentRow = row;
                        break;
                    }
                }
                
                this.form.Controls.ValuesList.Value = vtList;
                if (currentRow)
                    this.form.Controls.ValuesList.CurrentRow = currentRow;
            }
            else
            {
                var vtList = this.form.Controls.ValuesList.Value;
                vtList.Clear();    
                for (var rowNo = 0; rowNo < this.originalList.Count(); rowNo++)
                {
                    var row = this.originalList.Get(rowNo);
                    if (re.test(row.Name)) {						
                        //FillPropertyValues(vtList.Add(), row);	                						
                    	var newRow = vtList.Add();	                    
                    	newRow.Value = row.Value;
                    	newRow.Name = row.Name;
                    	newRow.Order = row.Order
                    }
                }
                if (this.form.Controls.ValuesList.Value.Count()) {
                    this.form.Controls.ValuesList.CurrentRow = this.form.Controls.ValuesList.Value.Get(0);
                }
            }
        }
    
        this.sortValuesList(this.form.SortByName);
        
    },

    Form_OnOpen: function () {

        this.form.Caption = this.caption ? this.caption : "Выберите значение";

        this.form.Controls.CmdBar.Buttons.SortByName.Check = this.form.SortByName;
        this.form.Controls.CmdBar.Buttons.DoNotFilter.Check = this.form.DoNotFilter;	    
        	   
        this.loadedOnOpen = true;	     
        
        this.tcWatcher.start();
    },

    Form_BeforeClose : function (Cancel, StandardHandler) {
        this.tcWatcher.stop();
    },

    ValuesList_Selection: function (Control, SelectedRow, Column, DefaultHandler) {
        this.form.Close(SelectedRow.val.Value);
    },

    CmdBar_SortByName: function (button) {
        button.val.Check = !button.val.Check;
        this.form.SortByName = button.val.Check;
        this.sortValuesList(button.val.Check);
    },

    CmdBar_DoNotFilter: function (button) {
        button.val.Check = !button.val.Check;
        this.form.DoNotFilter = button.val.Check;
        this.updateList(this.form.Controls.SearchText.Value);
    },

    CmdBarMain_ОК: function (Кнопка) {
        var SelectedRow = this.form.Controls.ValuesList.CurrentRow;
        if (SelectedRow)
            this.form.Close(SelectedRow.Value);
        else
            this.form.CurrentControl = this.form.Controls.SearchText;
    },

    SearchText_Tuning: function(Ctrl, Direction, DefaultHandler) {
        var curIndex = -1,
            grid = this.form.Controls.ValuesList;
        if (grid.CurrentRow) {
            curIndex = grid.Value.IndexOf(grid.CurrentRow);
            curIndex -= Direction.val;
            if (curIndex < 0) {
                curIndex = grid.Value.Count() - 1;
            } else if (curIndex >= grid.Value.Count()) {
                curIndex = 0;
            }
            grid.CurrentRow = grid.Value.Get(curIndex);
        }
        DefaultHandler.val = false;
    }
    
});

















