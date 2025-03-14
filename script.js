document.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('ai-output');
  const platformSelector = document.createElement('select');
  platformSelector.id = 'platform-select';
  
  // 添加平台选项
  const platforms = ['微博热搜', '哔哩哔哩', '知乎', '百度贴吧'];
  platforms.forEach(platform => {
    const option = document.createElement('option');
    option.value = platform;
    option.textContent = platform;
    platformSelector.appendChild(option);
  });

  // 获取热搜数据
  const fetchHotSearch = async (platform) => {
    try {
      const response = await fetch(`https://api.pearktrue.cn/api/dailyhot/?title=${encodeURIComponent(platform)}`);
      if (!response.ok) throw new Error('网络响应异常');
      return await response.json();
    } catch (error) {
      output.textContent = `数据加载失败: ${error.message}`;
      return null;
    }
  };

  // 渲染热搜列表
  const renderList = (data) => {
    const list = document.querySelector('.hotsearch-list');
    list.innerHTML = '';
    
    data.slice(0, 15).forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'hotsearch-item';
      li.textContent = item.title;
      li.dataset.hot = item.hot;
      list.appendChild(li);
    });
  };

  // 平台切换事件
  platformSelector.addEventListener('change', async () => {
    output.textContent = '加载中...';
    const data = await fetchHotSearch(platformSelector.value);
    if (data?.code === 200) renderList(data.data);
  });

  // 初始化默认加载微博热搜
  document.querySelector('h1').after(platformSelector);
  fetchHotSearch('微博热搜').then(data => {
    if (data?.code === 200) renderList(data.data);
  });

  // 点击事件处理
  document.querySelector('.hotsearch-list').addEventListener('click', async (e) => {
    if (!e.target.matches('.hotsearch-item')) return;
    
    output.classList.add('loading');
    output.textContent = '分析中...';
    
    try {
      const analysis = await getAIAnalysis(e.target.textContent);
      output.innerHTML = `<strong>${e.target.textContent}</strong><br>${analysis}`;
    } catch (error) {
      output.textContent = `分析失败: ${error.message}`;
    }
    output.classList.remove('loading');
  });
});


async function getAIAnalysis(title) {
  const response = await fetch(`https://api.siliconflow.cn/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk-vxlgnlyvjufjzbwrxlghsztbhkgwegbanrehvarmlqxnhrpk',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "Qwen/Qwen2-1.5B-Instruct",
      messages: [{
        role: "user",
        content: `请用中文简要分析这个热搜话题的潜在传播因素：${title}`
      }]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// 修改点击事件处理函数
document.querySelectorAll('.hotsearch-item').forEach(item => {
  item.addEventListener('click', async () => {
    const title = item.querySelector('.title').textContent;
    const output = document.getElementById('ai-output');
    
    output.classList.add('loading');
    try {
      const analysis = await getAIAnalysis(title);
      output.innerHTML = `<strong>AI分析：</strong>${analysis}`;
    } catch (error) {
      output.textContent = '分析失败，请稍后重试';
    }
    output.classList.remove('loading');
  });
});
