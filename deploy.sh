#!/bin/bash

echo "🚀 Rollout App - AWS Amplify Deployment Helper"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found package.json"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git not initialized. Please run 'git init' first."
    exit 1
fi

echo "✅ Git repository found"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes."
    echo "   Please commit your changes before deploying."
    git status --short
    exit 1
fi

echo "✅ No uncommitted changes"

# Check if remote is set
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Remote origin: $REMOTE_URL"
else
    echo "❌ Error: No remote origin set."
    echo "   Please run: git remote add origin https://github.com/stalkiq/rollout.git"
    exit 1
fi

# Check if we can push to remote
echo "🔄 Testing connection to GitHub..."
if git ls-remote origin > /dev/null 2>&1; then
    echo "✅ GitHub connection successful"
else
    echo "❌ Error: Cannot connect to GitHub repository."
    echo "   Please check your repository URL and permissions."
    exit 1
fi

echo ""
echo "🎯 Next Steps for AWS Amplify:"
echo "=============================="
echo "1. Go to: https://console.aws.amazon.com/amplify/"
echo "2. Click on your 'rollout' app"
echo "3. Go to 'App settings' → 'General'"
echo "4. Change 'Production branch' from 'master' to 'main'"
echo "5. Go to 'Build settings' and update with the config from deploy-to-amplify.md"
echo "6. Click 'Redeploy this version'"
echo ""
echo "📱 Your app will be live at: https://main.d33rq6bkkc6mdt.amplifyapp.com"
echo ""
echo "✅ All checks passed! Your code is ready for deployment."
