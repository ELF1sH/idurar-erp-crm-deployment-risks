Частотность выполнения запросов
```
sum(rate(http_requests_total[5m])) by (route)
```

95th Percentile Response Time by Route
```
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
```

```
app_memory_usage_bytes{type="heapUsed"}
```
