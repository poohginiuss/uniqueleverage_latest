#!/bin/bash
# Simple script to run the hourly ads cron job
curl -X GET https://ul-cursor.onrender.com/api/cron/create-hourly-ads
