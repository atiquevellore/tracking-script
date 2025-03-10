# Tracking-Script
Tracking user behavior publicly available via https://websdk-tracking-script.fly.dev/tracking.js

# Script Code used by Client will be

```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://websdk-tracking-script.fly.dev/tracking.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>


