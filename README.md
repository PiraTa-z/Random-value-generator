Generates random value, based on a regular expression.

Minified vestion in dist folder.
Source file is in


# INSTALLATION: 


```
    Include library in your HTML

    <script src="valueGenerator.js"></script>
```

```javascript

   // Create instance
   var regexValueGenerator = new ValueGenerator();
   
   // Generate random date
   var date = regexValueGenerator.generateValue(/(January|February|March|April|May|June|July|August|September|October|November|December) ([1-9]|[12][0-9]|3[01]), (19|20)[0-9][0-9]/);
   
   console.log(date);
   
   // For example, output will be: October 31
```


## EXAMPLES:


[http://pirata-z.github.io/Random-value-generator](http://pirata-z.github.io/Random-value-generator)